// Request approval and rejection processing

import { Address } from '@ton/core';
import { CHAIN } from '@tonconnect/protocol';

import type { EventConnectRequest, EventTransactionRequest, EventSignDataRequest } from '../types';
import type { SessionManager } from './SessionManager';
import type { BridgeManager } from './BridgeManager';
import { globalLogger } from './Logger';
import { CreateTonProofMessageBytes, createTonProofMessage } from '../utils/tonProof';

const log = globalLogger.createChild('RequestProcessor');

/**
 * TON Connect response types
 */
interface ConnectDevice {
    platform: 'windows' | 'mac' | 'linux' | 'android' | 'ios' | 'browser';
    appName: string;
    appVersion: string;
    maxProtocolVersion: number;
    features: Array<SendTransactionFeature | SignDataFeature>;
}

interface SendTransactionFeature {
    name: 'SendTransaction';
    maxMessages: number;
    extraCurrencySupported?: boolean;
}

interface SignDataFeature {
    name: 'SignData';
    types: Array<'text' | 'binary' | 'cell'>;
}

interface TonAddressItem {
    name: 'ton_addr';
    address: string;
    network: CHAIN;
    walletStateInit: string;
    publicKey: string;
}

interface TonProofResponseItem {
    name: 'ton_proof';
    proof: {
        timestamp: number;
        domain: {
            lengthBytes: number;
            value: string;
        };
        payload: string;
        signature: string;
    };
}

type ConnectResponseItem = TonAddressItem | TonProofResponseItem;

interface ConnectEventSuccess {
    event: 'connect';
    id: number;
    payload: {
        device: ConnectDevice;
        items: ConnectResponseItem[];
    };
}

/**
 * Handles approval and rejection of various request types
 */
export class RequestProcessor {
    constructor(
        private sessionManager: SessionManager,
        private bridgeManager: BridgeManager,
    ) {}

    /**
     * Process connect request approval
     */
    async approveConnectRequest(event: EventConnectRequest): Promise<void> {
        try {
            if (!event.wallet) {
                throw new Error('Wallet is required');
            }
            // Create session for this connection'
            const newSession = await this.sessionManager.createSession(event.id, event.dAppName, event.wallet);
            // Create bridge session
            await this.bridgeManager.createSession(newSession.sessionId);
            // Send approval response
            const response = await this.createConnectApprovalResponse(event);
            await this.bridgeManager.sendResponse(newSession.sessionId, event.id, response.result);
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
                dAppName: event.dAppName,
                reason: reason || 'User rejected connection',
            });

            // No response needed for rejections - just log and return
        } catch (error) {
            log.error('Failed to reject connect request', { error });
            throw error;
        }
    }

    /**
     * Process transaction request approval
     */
    async approveTransactionRequest(event: EventTransactionRequest): Promise<{ signedBoc: string }> {
        try {
            // Sign transaction with wallet
            const signedBoc = await this.signTransaction(event);

            // Send approval response
            const response = {
                result: signedBoc,
            };

            await this.bridgeManager.sendResponse(event.id, event.id, response);

            return { signedBoc };
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
            const response = {
                error: 'USER_REJECTED',
                reason: reason || 'User rejected transaction',
            };

            await this.bridgeManager.sendResponse(event.id, event.id, response);
        } catch (error) {
            log.error('Failed to reject transaction request', { error });
            throw error;
        }
    }

    /**
     * Process sign data request approval
     */
    async approveSignDataRequest(event: EventSignDataRequest): Promise<{ signature: Uint8Array }> {
        try {
            // Sign data with wallet
            const signature = await event.wallet.sign(event.data);

            // Send approval response
            const response = {
                result: Array.from(signature), // Convert to array for JSON serialization
            };

            await this.bridgeManager.sendResponse(event.id, event.id, response);

            return { signature };
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

            await this.bridgeManager.sendResponse(event.id, event.id, response);
        } catch (error) {
            log.error('Failed to reject sign data request', { error });
            throw error;
        }
    }

    /**
     * Create connect approval response
     */
    private async createConnectApprovalResponse(event: EventConnectRequest): Promise<{ result: ConnectEventSuccess }> {
        const wallet = event.wallet;
        if (!wallet) {
            throw new Error('Wallet is required for connect approval');
        }

        // Get wallet state init as base64 BOC
        const walletStateInit = await wallet.getStateInit();

        // Get public key as hex string
        const publicKey = Buffer.from(wallet.publicKey).toString('hex');

        // Get wallet address
        const address = wallet.getAddress();

        // Determine network (default to mainnet - TODO: make configurable)
        const network = CHAIN.MAINNET;

        // Create base response data
        const connectResponse: ConnectEventSuccess = {
            event: 'connect',
            id: Date.now(),
            payload: {
                device: {
                    platform: 'browser',
                    appName: 'tonkeeper',
                    appVersion: '1.0.0',
                    maxProtocolVersion: 2,
                    features: [
                        {
                            name: 'SendTransaction',
                            maxMessages: 4, // Default for most wallet types
                            extraCurrencySupported: true,
                        },
                        {
                            name: 'SignData',
                            types: ['text', 'binary', 'cell'],
                        },
                    ],
                },
                items: [
                    {
                        name: 'ton_addr',
                        address: Address.parse(address).toRawString(),
                        network,
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
                const dAppUrl = new URL(event.dAppUrl);
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
        // TODO: Implement proper transaction signing
        // This would involve:
        // 1. Parsing the transaction messages from event.request.messages
        // 2. Creating the transaction cell structure
        // 3. Signing with the wallet's private key
        // 4. Encoding the result to BOC format

        log.debug('Signing transaction', {
            id: event.id,
            messagesCount: event.request.messages.length,
            from: event.request.from,
            validUntil: event.request.valid_until,
        });

        // Mock implementation - replace with actual signing logic
        const mockSignedBoc = 'te6ccgECFAEAAtQAART/APSkE/S88sgLAQIBYgIDAgLNBAUE';

        return mockSignedBoc;
    }
}
