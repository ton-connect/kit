// Request approval and rejection processing

import { Address } from '@ton/core';
import {
    CHAIN,
    CONNECT_EVENT_ERROR_CODES,
    ConnectEventError,
    ConnectEventSuccess,
    SEND_TRANSACTION_ERROR_CODES,
    SendTransactionRpcResponseError,
    SendTransactionRpcResponseSuccess,
    SignDataRpcResponseSuccess,
} from '@tonconnect/protocol';

import type {
    EventConnectRequest,
    EventTransactionRequest,
    EventSignDataRequest,
    EventSignDataApproval,
    TonWalletKitOptions,
} from '../types';
import type { SessionManager } from './SessionManager';
import type { BridgeManager } from './BridgeManager';
import { globalLogger } from './Logger';
import { CreateTonProofMessageBytes, createTonProofMessage } from '../utils/tonProof';
import { CallForSuccess } from '../utils/retry';
import { PrepareTonConnectData } from '../utils/signData/sign';
import { ApiClient } from '../types/toncenter/ApiClient';
import { getDeviceInfoWithDefaults } from '../utils/getDefaultWalletConfig';
import { WalletManager } from './WalletManager';
import { EventConnectApproval, EventTransactionApproval } from '../types/events';

const log = globalLogger.createChild('RequestProcessor');

/**
 * Handles approval and rejection of various request types
 */
export class RequestProcessor {
    constructor(
        private walletKitOptions: TonWalletKitOptions,
        private sessionManager: SessionManager,
        private bridgeManager: BridgeManager,
        private walletManager: WalletManager,
        private client: ApiClient,
        private network: CHAIN,
    ) {}

    /**
     * Process connect request approval
     */
    async approveConnectRequest(event: EventConnectRequest | EventConnectApproval): Promise<void> {
        try {
            if (!event.walletAddress) {
                throw new Error('Wallet is required');
            }

            const wallet = this.walletManager.getWallet(event.walletAddress);
            if (!wallet) {
                throw new Error('Wallet not found');
            }

            // If event is EventConnectRequest, we need to create approval ourself
            if ('preview' in event && 'request' in event) {
                // Create session for this connection'
                const url = new URL(event.preview.dAppUrl);
                const domain = url.hostname;
                const newSession = await this.sessionManager.createSession(
                    event.from,
                    event.preview.dAppName,
                    domain,
                    wallet,
                );
                // Create bridge session
                await this.bridgeManager.createSession(newSession.sessionId);
                // Send approval response
                const response = await this.createConnectApprovalResponse(event);
                // event.from = newSession.sessionId;
                await this.bridgeManager.sendResponse(event, response.result);
            } else if ('result' in event) {
                // If event is EventConnectApproval, we need to send response to dApp and create session
                const url = new URL(event.result.dAppUrl);
                const domain = url.hostname;
                await this.sessionManager.createSession(event.from, event.result.dAppName, domain, wallet);
                await this.bridgeManager.sendResponse(event, event.result.response);
            } else {
                log.error('Invalid event', { event });
                throw new Error('Invalid event');
            }
        } catch (error) {
            log.error('Failed to approve connect request', { error });
            throw error;
        }
    }

    /**
     * Process connect request rejection
     */
    async rejectConnectRequest(event: EventConnectRequest, reason?: string): Promise<void> {
        try {
            log.info('Connect request rejected', {
                id: event.id,
                dAppName: event.preview.dAppName,
                reason: reason || 'User rejected connection',
            });

            const response: ConnectEventError = {
                event: 'connect_error',
                id: parseInt(event.id || ''),
                payload: {
                    code: CONNECT_EVENT_ERROR_CODES.USER_REJECTS_ERROR,
                    message: reason || 'User rejected connection',
                },
            };
            const newSession = await this.sessionManager.createSession(
                event.from,
                event.preview.dAppName,
                '',
                undefined,
                {
                    disablePersist: true,
                },
            );
            await this.bridgeManager.sendResponse(event, response, newSession);
        } catch (error) {
            log.error('Failed to reject connect request', { error });
            throw error;
        }
    }

    /**
     * Process transaction request approval
     */
    async approveTransactionRequest(
        event: EventTransactionRequest | EventTransactionApproval,
    ): Promise<{ signedBoc: string }> {
        try {
            if ('result' in event) {
                await CallForSuccess(() => this.client.sendBoc(Buffer.from(event.result.signedBoc, 'base64')));

                // Send approval response
                const response: SendTransactionRpcResponseSuccess = {
                    result: event.result.signedBoc,
                    id: event.id || '',
                };

                await this.bridgeManager.sendResponse(event, response);
                return { signedBoc: event.result.signedBoc };
            } else {
                const signedBoc = await this.signTransaction(event);

                await CallForSuccess(() => this.client.sendBoc(Buffer.from(signedBoc, 'base64')));

                // Send approval response
                const response: SendTransactionRpcResponseSuccess = {
                    result: signedBoc,
                    id: event.id || '',
                };

                await this.bridgeManager.sendResponse(event, response);
                return { signedBoc };
            }
        } catch (error) {
            log.error('Failed to approve transaction request', { error });
            throw error;
        }
    }

    /**
     * Process transaction request rejection
     */
    async rejectTransactionRequest(event: EventTransactionRequest, reason?: string): Promise<void> {
        try {
            const response: SendTransactionRpcResponseError = {
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
                    message: reason || 'User rejected transaction',
                },
                id: event.id,
            };

            await this.bridgeManager.sendResponse(event, response);
        } catch (error) {
            log.error('Failed to reject transaction request', { error });
            throw error;
        }
    }

    /**
     * Process sign data request approval
     */
    async approveSignDataRequest(
        event: EventSignDataRequest | EventSignDataApproval,
    ): Promise<{ signature: Uint8Array }> {
        try {
            if ('result' in event) {
                // Send approval response
                const response: SignDataRpcResponseSuccess = {
                    id: event.id || '',
                    result: {
                        signature: event.result.signature,
                        address: event.result.address,
                        timestamp: event.result.timestamp,
                        domain: event.result.domain,
                        payload: event.result.payload,
                    },
                };

                await this.bridgeManager.sendResponse(event, response);
                return { signature: Buffer.from(event.result.signature, 'base64') };
            } else {
                if (!event.domain) {
                    throw new Error('Domain is required for sign data request');
                }

                if (!event.walletAddress) {
                    throw new Error('Wallet address is required for sign data request');
                }

                const wallet = this.walletManager.getWallet(event.walletAddress);
                if (!wallet) {
                    throw new Error('Wallet not found');
                }
                // Sign data with wallet
                const signData = PrepareTonConnectData({
                    payload: event.request,
                    domain: event.domain,
                    address: event.walletAddress,
                });
                const signature = await wallet.sign(signData.hash);

                // Send approval response
                const response: SignDataRpcResponseSuccess = {
                    id: event.id,
                    result: {
                        signature: Buffer.from(signature).toString('base64'),
                        address: Address.parse(signData.address).toRawString(),
                        timestamp: signData.timestamp,
                        domain: signData.domain,
                        payload: signData.payload,
                    },
                };

                await this.bridgeManager.sendResponse(event, response);
                return { signature };
            }
        } catch (error) {
            log.error('Failed to approve sign data request', { error });
            throw error;
        }
    }

    /**
     * Process sign data request rejection
     */
    async rejectSignDataRequest(event: EventSignDataRequest, reason?: string): Promise<void> {
        try {
            const response = {
                error: 'USER_REJECTED',
                reason: reason || 'User rejected data signing',
            };

            await this.bridgeManager.sendResponse(event, response);
        } catch (error) {
            log.error('Failed to reject sign data request', { error });
            throw error;
        }
    }

    /**
     * Create connect approval response
     */
    private async createConnectApprovalResponse(event: EventConnectRequest): Promise<{ result: ConnectEventSuccess }> {
        const walletAddress = event.walletAddress;
        if (!walletAddress) {
            throw new Error('Wallet address is required for connect approval');
        }
        const wallet = this.walletManager.getWallet(walletAddress);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        // Get wallet state init as base64 BOC
        const walletStateInit = await wallet.getStateInit();

        // Get public key as hex string
        const publicKey = Buffer.from(wallet.publicKey).toString('hex');

        // Get wallet address
        const address = wallet.getAddress();

        // Create base response data
        const connectResponse: ConnectEventSuccess = {
            event: 'connect',
            id: Date.now(),
            payload: {
                device: getDeviceInfoWithDefaults(this.walletKitOptions.deviceInfo),
                items: [
                    {
                        name: 'ton_addr',
                        address: Address.parse(address).toRawString(),
                        network: this.network,
                        walletStateInit,
                        publicKey,
                    },
                ],
            },
        };

        // TODO: Handle ton_proof if requested
        // This would require access to the original connect request items
        // and the ability to sign the proof with the wallet's private key
        const proofItem = event.request.find((item) => item.name === 'ton_proof');
        if (proofItem) {
            let domain = {
                LengthBytes: 0,
                Value: '',
            };
            try {
                const dAppUrl = new URL(event.preview.dAppUrl);
                domain = {
                    LengthBytes: Buffer.from(dAppUrl.host).length,
                    Value: dAppUrl.host,
                };
            } catch (error) {
                log.error('Failed to parse domain', { error });
            }
            // const walletKeyPair = secretKeyToED25519(decryptedData.seed);

            const timestamp = Math.floor(Date.now() / 1000);
            const signMessage = createTonProofMessage({
                address: Address.parse(address),
                domain,
                payload: proofItem.payload,
                stateInit: walletStateInit,
                timestamp,
            });

            const signature = await wallet.sign(await CreateTonProofMessageBytes(signMessage));
            connectResponse.payload.items.push({
                name: 'ton_proof',
                proof: {
                    timestamp,
                    domain: {
                        lengthBytes: domain.LengthBytes,
                        value: domain.Value,
                    },
                    payload: proofItem.payload,
                    signature: Buffer.from(signature).toString('base64'),
                },
            });
        }

        return {
            result: connectResponse,
        };
    }

    /**
     * Sign transaction and return BOC
     */
    private async signTransaction(event: EventTransactionRequest): Promise<string> {
        if (!event.walletAddress) {
            throw new Error('Wallet address is required');
        }
        const wallet = this.walletManager.getWallet(event.walletAddress);
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        const signedBoc = await wallet.getSignedExternal(event.request, {
            fakeSignature: false,
        });

        log.debug('Signing transaction', {
            id: event.id,
            messagesCount: event.request.messages.length,
            from: event.request.from,
            validUntil: event.request.valid_until,
        });

        return signedBoc;
    }
}
