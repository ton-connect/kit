/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Request approval and rejection processing

import { Address } from '@ton/core';
import type {
    ConnectEventError,
    ConnectEventSuccess,
    SendTransactionRpcResponseError,
    SendTransactionRpcResponseSuccess,
    SignDataRpcResponseError,
    SignDataRpcResponseSuccess,
    TonProofItemReplySuccess,
    SignDataPayload as TonConnectSignDataPayload,
} from '@tonconnect/protocol';
import {
    CHAIN,
    CONNECT_EVENT_ERROR_CODES,
    SEND_TRANSACTION_ERROR_CODES,
    SIGN_DATA_ERROR_CODES,
} from '@tonconnect/protocol';
import { getSecureRandomBytes } from '@ton/crypto';

import type { EventSignDataApproval, TonWalletKitOptions } from '../types';
import type { TONConnectSessionManager } from '../api/interfaces/TONConnectSessionManager';
import type { BridgeManager } from './BridgeManager';
import { globalLogger } from './Logger';
import { CreateTonProofMessage } from '../utils/tonProof';
import { CallForSuccess } from '../utils/retry';
import { getDeviceInfoForWallet } from '../utils/getDefaultWalletConfig';
import type { WalletManager } from './WalletManager';
import type { EventConnectApproval, EventTransactionApproval } from '../types/events';
import { WalletKitError, ERROR_CODES } from '../errors';
import { Base64ToHex, HexToBase64 } from '../utils/base64';
import type {
    TransactionRequest,
    SignDataPayload,
    TransactionRequestEvent,
    SignDataRequestEvent,
    ConnectionRequestEvent,
    TransactionApprovalResponse,
    SignDataApprovalResponse,
    Base64String,
} from '../api/models';
import { PrepareSignData } from '../utils/signData/sign';
import type { Wallet } from '../api/interfaces';
import type { Analytics, AnalyticsManager } from '../analytics';

const log = globalLogger.createChild('RequestProcessor');

/**
 * Handles approval and rejection of various request types
 */
export class RequestProcessor {
    private analytics?: Analytics;

    constructor(
        private walletKitOptions: TonWalletKitOptions,
        private sessionManager: TONConnectSessionManager,
        private bridgeManager: BridgeManager,
        private walletManager: WalletManager,
        analyticsManager?: AnalyticsManager,
    ) {
        this.analytics = analyticsManager?.scoped();
    }

    /**
     * Helper to get wallet from event, supporting both walletId and walletAddress
     */
    private getWalletFromEvent(event: { walletId?: string }): Wallet | undefined {
        if (event.walletId) {
            return this.walletManager.getWallet(event.walletId);
        }
        return undefined;
    }

    /**
     * Helper to get wallet address from event
     */
    private getWalletAddressFromEvent(event: { walletId?: string; walletAddress?: string }): string | undefined {
        if (event.walletAddress) {
            return event.walletAddress;
        }
        if (event.walletId) {
            return this.walletManager.getWallet(event.walletId)?.getAddress();
        }
        return undefined;
    }

    /**
     * Process connect request approval
     */
    async approveConnectRequest(event: ConnectionRequestEvent | EventConnectApproval): Promise<void> {
        try {
            // If event is ConnectionRequestEvent, we need to create approval ourself
            if ('preview' in event) {
                const walletId = event.walletId;

                if (!walletId) {
                    const error = new WalletKitError(
                        ERROR_CODES.WALLET_REQUIRED,
                        'Wallet is required for connect request approval',
                        undefined,
                        { eventId: event.id },
                    );
                    throw error;
                }

                const wallet = this.getWalletFromEvent(event);
                if (!wallet) {
                    const error = new WalletKitError(
                        ERROR_CODES.WALLET_NOT_FOUND,
                        'Wallet not found for connect request',
                        undefined,
                        { walletId, eventId: event.id },
                    );
                    throw error;
                }

                // Create session for this connection'
                const newSession = await this.sessionManager.createSession(
                    event.from || (await getSecureRandomBytes(32)).toString('hex'),
                    {
                        name: event.preview.dAppInfo?.name || '',
                        url: event.preview.dAppInfo?.url || '',
                        iconUrl: event.preview.dAppInfo?.iconUrl || '',
                        description: event.preview.dAppInfo?.description || '',
                    },
                    wallet,
                    {
                        isJsBridge: event.isJsBridge,
                    },
                );
                // Create bridge session
                await this.bridgeManager.createSession(newSession.sessionId);
                // Send approval response
                const response = await this.createConnectApprovalResponse(event);
                // event.from = newSession.sessionId;
                await this.bridgeManager.sendResponse(event, response.result);

                if (this.analytics) {
                    const sessionData = event.from
                        ? await this.sessionManager.getSession(newSession.sessionId)
                        : undefined;

                    // Send wallet-sign-data-request-received event
                    this.analytics.emitWalletConnectAccepted({
                        client_id: event.from,
                        wallet_id: sessionData?.publicKey,
                        trace_id: event.traceId,
                        network_id: wallet.getNetwork().chainId,
                        origin_url: event.dAppInfo?.url,
                        dapp_name: event.dAppInfo?.name,
                        is_ton_addr: event.requestedItems.some((item) => item.type === 'ton_addr'),
                        is_ton_proof: event.requestedItems.some((item) => item.type === 'ton_proof'),
                        manifest_json_url: event.dAppInfo?.manifestUrl,
                        proof_payload_size: event.requestedItems.find((item) => item.type === 'ton_proof')?.value
                            ?.payload?.length,
                    });
                    this.analytics.emitWalletConnectResponseSent({
                        client_id: event.from,
                        wallet_id: sessionData?.publicKey,
                        trace_id: event.traceId,
                        dapp_name: event.dAppInfo?.name,
                        origin_url: event.dAppInfo?.url,
                        is_ton_addr: event.requestedItems.some((item) => item.type === 'ton_addr'),
                        is_ton_proof: event.requestedItems.some((item) => item.type === 'ton_proof'),
                        manifest_json_url: event.preview.dAppInfo?.manifestUrl,
                        proof_payload_size: event.requestedItems.find((item) => item.type === 'ton_proof')?.value
                            .payload?.length,
                        network_id: wallet.getNetwork().chainId,
                    });
                }
            } else if ('result' in event) {
                const walletId = event.walletId;

                if (!walletId) {
                    const error = new WalletKitError(
                        ERROR_CODES.WALLET_REQUIRED,
                        'Wallet is required for connect approval result',
                        undefined,
                        { eventId: event.id },
                    );
                    throw error;
                }

                const wallet = this.getWalletFromEvent(event);
                if (!wallet) {
                    const error = new WalletKitError(
                        ERROR_CODES.WALLET_NOT_FOUND,
                        'Wallet not found for connect approval result',
                        undefined,
                        { walletId, eventId: event.id },
                    );
                    throw error;
                }

                // If event is EventConnectApproval, we need to send response to dApp and create session
                await this.sessionManager.createSession(
                    event.from || (await getSecureRandomBytes(32)).toString('hex'),
                    {
                        name: event.result.dAppName,
                        url: event.result.dAppUrl,
                        iconUrl: event.result.dAppIconUrl,
                        description: event.result.dAppDescription,
                    },
                    wallet,
                );
                await this.bridgeManager.sendResponse(event, event.result.response);

                if (this.analytics) {
                    const sessionData = event.from ? await this.sessionManager.getSession(event.from) : undefined;

                    // Send wallet-sign-data-request-received event
                    this.analytics.emitWalletConnectAccepted({
                        client_id: event.from,
                        wallet_id: sessionData?.publicKey,
                        trace_id: event.traceId,
                        network_id: wallet.getNetwork().chainId,
                        is_ton_addr: event.result.response.payload.items.some((item) => item.name === 'ton_addr'),
                        is_ton_proof: event.result.response.payload.items.some((item) => item.name === 'ton_proof'),
                        manifest_json_url: event.result.dAppUrl,
                        proof_payload_size: (
                            event.result.response.payload.items.find(
                                (item) => item.name === 'ton_proof',
                            ) as TonProofItemReplySuccess
                        )?.proof?.payload?.length,
                        dapp_name: event.result.dAppName,
                        origin_url: event.result.dAppUrl,
                    });
                    this.analytics.emitWalletConnectResponseSent({
                        client_id: event.from,
                        wallet_id: sessionData?.publicKey,
                        trace_id: event.traceId,
                        dapp_name: event.result.dAppName,
                        origin_url: event.result.dAppUrl,
                        is_ton_addr: event.result.response.payload.items.some((item) => item.name === 'ton_addr'),
                        is_ton_proof: event.result.response.payload.items.some((item) => item.name === 'ton_proof'),
                        manifest_json_url: event.result.dAppUrl,
                        proof_payload_size: (
                            event.result.response.payload.items.find(
                                (item) => item.name === 'ton_proof',
                            ) as TonProofItemReplySuccess
                        )?.proof?.payload?.length,
                        network_id: wallet.getNetwork().chainId,
                    });
                }
            } else {
                log.error('Invalid event', { event });
                const error = new WalletKitError(
                    ERROR_CODES.INVALID_REQUEST_EVENT,
                    'Invalid connect request event',
                    undefined,
                    { event },
                );
                throw error;
            }

            return;
        } catch (error) {
            log.error('Failed to approve connect request', { error });
            throw error;
        }
    }

    /**
     * Process connect request rejection
     */
    async rejectConnectRequest(
        event: ConnectionRequestEvent,
        reason?: string,
        errorCode?: CONNECT_EVENT_ERROR_CODES,
    ): Promise<void> {
        try {
            log.info('Connect request rejected', {
                id: event.id,
                dAppName: event.preview.dAppInfo?.name || '',
                reason: reason || 'User rejected connection',
            });

            const response: ConnectEventError = {
                event: 'connect_error',
                id: 1, // parseInt(event.id || '') ?? 1,
                payload: {
                    code: errorCode ?? CONNECT_EVENT_ERROR_CODES.USER_REJECTS_ERROR,
                    message: reason || 'User rejected connection',
                },
            };
            const newSession = await this.sessionManager.createSession(
                event.from || '',
                {
                    name: event.preview.dAppInfo?.name || '',
                    url: '',
                    iconUrl: '',
                    description: '',
                },
                undefined,
                {
                    disablePersist: true,
                },
            );

            try {
                await this.bridgeManager.sendResponse(event, response, newSession);
            } catch (error) {
                log.error('Failed to send connect request rejection response', { error });
            }

            if (this.analytics) {
                const sessionData = event.from ? await this.sessionManager.getSession(newSession.sessionId) : undefined;

                // Send wallet-sign-data-request-received event
                this.analytics.emitWalletConnectRejected({
                    client_id: event.from,
                    wallet_id: sessionData?.publicKey,
                    trace_id: event.traceId,
                    dapp_name: event.preview.dAppInfo?.name || '',
                    origin_url: event.preview.dAppInfo?.url || '',
                    manifest_json_url: event.preview.dAppInfo?.manifestUrl || '',
                    is_ton_addr: event.requestedItems.some((item) => item.type === 'ton_addr'),
                    is_ton_proof: event.requestedItems.some((item) => item.type === 'ton_proof'),
                    proof_payload_size: event.requestedItems.find((item) => item.type === 'ton_proof')?.value.payload
                        ?.length,
                });
                this.analytics.emitWalletConnectResponseSent({
                    wallet_id: sessionData?.publicKey,
                    trace_id: event.traceId,
                    dapp_name: event.preview.dAppInfo?.name || '',
                    origin_url: event.preview.dAppInfo?.url || '',
                    manifest_json_url: event.preview.dAppInfo?.manifestUrl || '',
                    is_ton_addr: event.requestedItems.some((item) => item.type === 'ton_addr'),
                    is_ton_proof: event.requestedItems.some((item) => item.type === 'ton_proof'),
                    proof_payload_size: event.requestedItems.find((item) => item.type === 'ton_proof')?.value.payload
                        ?.length,
                    client_id: event.from,
                });
            }

            return;
        } catch (error) {
            log.error('Failed to reject connect request', { error });
            throw error;
        }
    }

    /**
     * Process transaction request approval
     */
    async approveTransactionRequest(
        event: TransactionRequestEvent | EventTransactionApproval,
    ): Promise<TransactionApprovalResponse> {
        try {
            if ('result' in event) {
                if (!this.walletKitOptions.dev?.disableNetworkSend) {
                    // Get the client for the wallet's network
                    const client = this.getClientForWallet(event.walletId);
                    await CallForSuccess(() => client.sendBoc(event.result.signedBoc));
                }

                // Send approval response
                const response: SendTransactionRpcResponseSuccess = {
                    result: event.result.signedBoc,
                    id: event.id || '',
                };

                await this.bridgeManager.sendResponse(event, response);
                this.sendTransactionAnalytics(event, event.result.signedBoc);
                return { signedBoc: event.result.signedBoc };
            } else {
                const signedBoc = await this.signTransaction(event);

                if (!this.walletKitOptions.dev?.disableNetworkSend) {
                    // Get the client for the wallet's network
                    const client = this.getClientForWallet(event.walletId);
                    await CallForSuccess(() => client.sendBoc(signedBoc));
                }

                // Send approval response
                const response: SendTransactionRpcResponseSuccess = {
                    result: signedBoc,
                    id: event.id || '',
                };

                await this.bridgeManager.sendResponse(event, response);
                this.sendTransactionAnalytics(event, signedBoc);
                return { signedBoc };
            }
        } catch (error) {
            log.error('Failed to approve transaction request', { error });

            if (error instanceof WalletKitError) {
                throw error;
            }
            if ((error as { message: string })?.message?.includes('Ledger device')) {
                throw new WalletKitError(ERROR_CODES.LEDGER_DEVICE_ERROR, 'Ledger device error', error as Error);
            }
            throw error;
        }
    }

    /**
     * Send transaction analytics events
     */
    private sendTransactionAnalytics(
        event: TransactionRequestEvent | EventTransactionApproval,
        signedBoc: string,
    ): void {
        if (!this.analytics) return;

        const wallet = this.getWalletFromEvent(event);

        this.analytics.emitWalletTransactionSent({
            trace_id: event.traceId,
            network_id: wallet?.getNetwork().chainId,
            client_id: event.from,
            signed_boc: signedBoc,
        });
    }

    /**
     * Process transaction request rejection
     */
    async rejectTransactionRequest(
        event: TransactionRequestEvent,
        reason?: string | SendTransactionRpcResponseError['error'],
    ): Promise<void> {
        try {
            const response: SendTransactionRpcResponseError =
                typeof reason === 'string' || typeof reason === 'undefined'
                    ? {
                          error: {
                              code: SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
                              message: reason || 'User rejected transaction',
                          },
                          id: event.id,
                      }
                    : {
                          error: reason,
                          id: event.id,
                      };

            await this.bridgeManager.sendResponse(event, response);
            const wallet = this.getWalletFromEvent(event);

            if (this.analytics) {
                const sessionData = event.from ? await this.sessionManager.getSession(event.from) : undefined;

                this.analytics.emitWalletTransactionDeclined({
                    wallet_id: sessionData?.publicKey,
                    trace_id: event.traceId,
                    dapp_name: event.dAppInfo?.name,
                    origin_url: event.dAppInfo?.url,
                    network_id: wallet?.getNetwork().chainId,
                    client_id: event.from,
                    decline_reason: typeof reason === 'string' ? reason : reason?.message,
                });
            }

            return;
        } catch (error) {
            log.error('Failed to reject transaction request', { error });
            throw error;
        }
    }

    /**
     * Process sign data request approval
     */
    async approveSignDataRequest(
        event: SignDataRequestEvent | EventSignDataApproval,
    ): Promise<SignDataApprovalResponse> {
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
                        payload: toTonConnectSignDataPayload(event.result.payload),
                    },
                };

                await this.bridgeManager.sendResponse(event, response);
                const wallet = this.getWalletFromEvent(event);

                if (this.analytics) {
                    const sessionData = event.from ? await this.sessionManager.getSession(event.from) : undefined;

                    this.analytics.emitWalletSignDataAccepted({
                        wallet_id: sessionData?.publicKey,
                        trace_id: event.traceId,
                        network_id: wallet?.getNetwork().chainId,
                        client_id: event.from,
                    });
                    this.analytics.emitWalletSignDataSent({
                        wallet_id: sessionData?.publicKey,
                        trace_id: event.traceId,
                        network_id: wallet?.getNetwork().chainId,
                        client_id: event.from,
                    });
                }

                return { signature: Base64ToHex(event.result.signature) };
            } else {
                if (!event.domain) {
                    const error = new WalletKitError(
                        ERROR_CODES.SESSION_DOMAIN_REQUIRED,
                        'Domain is required for sign data request',
                        undefined,
                        { eventId: event.id },
                    );
                    throw error;
                }

                const walletId = event.walletId;
                const walletAddress = this.getWalletAddressFromEvent(event);

                if (!walletId && !walletAddress) {
                    const error = new WalletKitError(
                        ERROR_CODES.WALLET_REQUIRED,
                        'Wallet ID is required for sign data request',
                        undefined,
                        { eventId: event.id },
                    );
                    throw error;
                }

                const wallet = this.getWalletFromEvent(event);
                if (!wallet) {
                    const error = new WalletKitError(
                        ERROR_CODES.WALLET_NOT_FOUND,
                        'Wallet not found for sign data request',
                        undefined,
                        { walletId, walletAddress, eventId: event.id },
                    );
                    throw error;
                }

                let domainUrl = event.domain;
                try {
                    domainUrl = new URL(event.domain).host;
                } catch {
                    //
                }

                // Sign data with wallet
                const signData = PrepareSignData({
                    payload: event.payload,
                    domain: domainUrl,
                    address: wallet.getAddress(),
                });
                const signature = await wallet.getSignedSignData(signData);
                const signatureBase64 = HexToBase64(signature);

                // Send approval response
                const response: SignDataRpcResponseSuccess = {
                    id: event.id,
                    result: {
                        signature: signatureBase64,
                        address: Address.parse(signData.address).toRawString(),
                        timestamp: signData.timestamp,
                        domain: signData.domain,
                        payload: toTonConnectSignDataPayload(signData.payload),
                    },
                };

                await this.bridgeManager.sendResponse(event, response);

                if (this.analytics) {
                    const sessionData = event.from ? await this.sessionManager.getSession(event.from) : undefined;

                    this.analytics.emitWalletSignDataAccepted({
                        wallet_id: sessionData?.publicKey,
                        trace_id: event.traceId,
                        dapp_name: event.dAppInfo?.name,
                        origin_url: event.dAppInfo?.url,
                        network_id: wallet.getNetwork().chainId,
                        client_id: event.from,
                    });
                    this.analytics.emitWalletSignDataSent({
                        wallet_id: sessionData?.publicKey,
                        trace_id: event.traceId,
                        dapp_name: event.dAppInfo?.name,
                        origin_url: event.dAppInfo?.url,
                        network_id: wallet.getNetwork().chainId,
                        client_id: event.from,
                    });
                }

                return { signature: signature };
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            log.error('Failed to approve sign data request', {
                error: error?.message?.toString() ?? error?.toString(),
            });
            if (error instanceof WalletKitError) {
                throw error;
            }
            throw error;
        }
    }

    /**
     * Process sign data request rejection
     */
    async rejectSignDataRequest(event: SignDataRequestEvent, reason?: string): Promise<void> {
        try {
            const response: SignDataRpcResponseError =
                typeof reason === 'string' || typeof reason === 'undefined'
                    ? {
                          error: {
                              code: SIGN_DATA_ERROR_CODES.USER_REJECTS_ERROR,
                              message: reason || 'User rejected transaction',
                          },
                          id: event.id,
                      }
                    : {
                          error: reason,
                          id: event.id,
                      };

            await this.bridgeManager.sendResponse(event, response);
            const wallet = this.getWalletFromEvent(event);

            if (this.analytics) {
                const sessionData = event.from ? await this.sessionManager.getSession(event.from) : undefined;

                this.analytics.emitWalletSignDataDeclined({
                    wallet_id: sessionData?.publicKey,
                    trace_id: event.traceId,
                    dapp_name: event.dAppInfo?.name,
                    origin_url: event.dAppInfo?.url,
                    network_id: wallet?.getNetwork().chainId,
                    client_id: event.from,
                });
            }

            return;
        } catch (error) {
            log.error('Failed to reject sign data request', { error });
            throw error;
        }
    }

    /**
     * Create connect approval response
     */
    private async createConnectApprovalResponse(
        event: ConnectionRequestEvent,
    ): Promise<{ result: ConnectEventSuccess }> {
        const walletId = event.walletId;
        const walletAddress = this.getWalletAddressFromEvent(event);

        if (!walletId && !walletAddress) {
            throw new WalletKitError(
                ERROR_CODES.WALLET_REQUIRED,
                'Wallet ID is required for connect approval response',
                undefined,
                { eventId: event.id },
            );
        }
        const wallet = this.getWalletFromEvent(event);
        if (!wallet) {
            throw new WalletKitError(
                ERROR_CODES.WALLET_NOT_FOUND,
                'Wallet not found for connect approval response',
                undefined,
                { walletId, walletAddress, eventId: event.id },
            );
        }

        // Get wallet state init as base64 BOC
        const walletStateInit = await wallet.getStateInit();

        // Get public key as hex string
        const publicKey = wallet.getPublicKey().replace('0x', '');

        // Get wallet address
        const address = wallet.getAddress();

        // Get the wallet's network
        const walletNetwork = wallet.getNetwork();

        // Get device info with wallet-specific features if available
        const deviceInfo = getDeviceInfoForWallet(wallet, this.walletKitOptions.deviceInfo);

        // Create base response data
        const connectResponse: ConnectEventSuccess = {
            event: 'connect',
            id: Date.now(),
            payload: {
                device: deviceInfo,
                items: [
                    {
                        name: 'ton_addr',
                        address: Address.parse(address).toRawString(),
                        // TODO: Support multiple networks
                        network: walletNetwork.chainId === CHAIN.MAINNET ? CHAIN.MAINNET : CHAIN.TESTNET,
                        walletStateInit,
                        publicKey,
                    },
                ],
            },
        };

        // TODO: Handle ton_proof if requested
        // This would require access to the original connect request items
        // and the ability to sign the proof with the wallet's private key
        const proofItem = event.requestedItems.find((item) => item.type === 'ton_proof');
        if (proofItem) {
            let domain = {
                lengthBytes: 0,
                value: '',
            };
            try {
                const dAppUrl = new URL(event.preview.dAppInfo?.url || '');
                domain = {
                    lengthBytes: Buffer.from(dAppUrl.host).length,
                    value: dAppUrl.host,
                };
            } catch (error) {
                log.error('Failed to parse domain', { error });
            }
            // const walletKeyPair = secretKeyToED25519(decryptedData.seed);

            const timestamp = Math.floor(Date.now() / 1000);
            const signMessage = CreateTonProofMessage({
                address: Address.parse(address),
                domain,
                payload: proofItem.value.payload,
                stateInit: walletStateInit,
                timestamp,
            });

            const signature = await wallet.getSignedTonProof(signMessage);
            // remove 0x
            const signatureBase64 = Buffer.from(signature.slice(2), 'hex').toString('base64');
            connectResponse.payload.items.push({
                name: 'ton_proof',
                proof: {
                    timestamp,
                    domain: {
                        lengthBytes: domain.lengthBytes,
                        value: domain.value,
                    },
                    payload: proofItem.value.payload,
                    signature: signatureBase64,
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
    private async signTransaction(event: TransactionRequestEvent): Promise<Base64String> {
        const walletId = event.walletId;
        const walletAddress = this.getWalletAddressFromEvent(event);

        if (!walletId && !walletAddress) {
            throw new WalletKitError(
                ERROR_CODES.WALLET_REQUIRED,
                'Wallet ID is required for transaction signing',
                undefined,
                { eventId: event.id },
            );
        }
        const wallet = this.getWalletFromEvent(event);
        if (!wallet) {
            throw new WalletKitError(
                ERROR_CODES.WALLET_NOT_FOUND,
                'Wallet not found for transaction signing',
                undefined,
                { walletId, walletAddress, eventId: event.id },
            );
        }

        const validUntil = event.request.validUntil;
        if (validUntil) {
            const now = Math.floor(Date.now() / 1000);
            if (validUntil < now) {
                throw new WalletKitError(
                    ERROR_CODES.VALIDATION_ERROR,
                    'Transaction valid_until timestamp is in the past',
                    undefined,
                    { validUntil, currentTime: now },
                );
            }
        }

        return await signTransactionInternal(wallet, event.request);
    }

    /**
     * Get API client for a wallet's network
     * Uses the wallet's network to get the appropriate client from NetworkManager
     */
    private getClientForWallet(walletId: string | undefined) {
        if (!walletId) {
            throw new WalletKitError(ERROR_CODES.WALLET_REQUIRED, 'Wallet address is required to get API client');
        }

        const wallet = this.walletManager.getWallet(walletId);
        if (!wallet) {
            throw new WalletKitError(ERROR_CODES.WALLET_NOT_FOUND, `Wallet not found: ${walletId}`);
        }

        return wallet.getClient();
    }
}

/**
 * Internal helper to sign transaction
 */
export async function signTransactionInternal(wallet: Wallet, request: TransactionRequest): Promise<Base64String> {
    const signedBoc = await wallet.getSignedSendTransaction(request, {
        fakeSignature: false,
    });

    log.debug('Signing transaction', {
        messagesNumber: request.messages.length,
        fromAddress: request.fromAddress,
        validUntil: request.validUntil,
    });

    return signedBoc;
}

function toTonConnectSignDataPayload(payload: SignDataPayload): TonConnectSignDataPayload {
    let network: CHAIN | undefined;

    if (payload.network?.chainId === CHAIN.MAINNET) {
        network = CHAIN.MAINNET;
    } else if (payload.network?.chainId === CHAIN.TESTNET) {
        network = CHAIN.TESTNET;
    } else {
        network = undefined;
    }

    if (payload.data.type === 'text') {
        return {
            network: network,
            from: payload.fromAddress,
            type: 'text',
            text: payload.data.value.content,
        };
    } else if (payload.data.type === 'cell') {
        return {
            network: network,
            from: payload.fromAddress,
            type: 'cell',
            schema: payload.data.value.schema,
            cell: payload.data.value.content,
        };
    } else {
        return {
            network: network,
            from: payload.fromAddress,
            type: 'binary',
            bytes: payload.data.value.content,
        };
    }
}
