/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

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
    TonProofItemReplySuccess,
} from '@tonconnect/protocol';
import { getSecureRandomBytes } from '@ton/crypto';

import type {
    EventConnectRequest,
    EventTransactionRequest,
    EventSignDataRequest,
    EventSignDataApproval,
    TonWalletKitOptions,
} from '../types';
import type { ConnectTransactionParamContent } from '../types/internal';
import type { SessionManager } from './SessionManager';
import type { BridgeManager } from './BridgeManager';
import { globalLogger } from './Logger';
import { createTonProofMessage } from '../utils/tonProof';
import { CallForSuccess } from '../utils/retry';
import { PrepareTonConnectData } from '../utils/signData/sign';
import { ApiClient } from '../types/toncenter/ApiClient';
import { getDeviceInfoWithDefaults } from '../utils/getDefaultWalletConfig';
import { WalletManager } from './WalletManager';
import { IWallet } from '../types';
import {
    EventConnectApproval,
    EventSignDataResponse,
    EventTransactionApproval,
    EventTransactionResponse,
} from '../types/events';
import { asHex } from '../types/primitive';
import { AnalyticsApi } from '../analytics/sender';
import { WalletKitError, ERROR_CODES } from '../errors';
import { uuidv7 } from '../utils/uuid';
import { getUnixtime } from '../utils/time';
import { getEventsSubsystem, getVersion } from '../utils/version';
import { Base64Normalize } from '../utils/base64';

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
        private analyticsApi?: AnalyticsApi,
    ) {}

    /**
     * Process connect request approval
     */
    async approveConnectRequest(event: EventConnectRequest | EventConnectApproval): Promise<void> {
        try {
            // If event is EventConnectRequest, we need to create approval ourself
            if ('preview' in event && 'request' in event) {
                if (!event.walletAddress) {
                    const error = new WalletKitError(
                        ERROR_CODES.WALLET_REQUIRED,
                        'Wallet is required for connect request approval',
                        undefined,
                        { eventId: event.id },
                    );
                    throw error;
                }

                const wallet = this.walletManager.getWallet(event.walletAddress);
                if (!wallet) {
                    const error = new WalletKitError(
                        ERROR_CODES.WALLET_NOT_FOUND,
                        'Wallet not found for connect request',
                        undefined,
                        { walletAddress: event.walletAddress, eventId: event.id },
                    );
                    throw error;
                }

                // Create session for this connection'
                const url = new URL(event.preview.manifest?.url || '');
                const domain = url.host;
                const newSession = await this.sessionManager.createSession(
                    event.from || (await getSecureRandomBytes(32)).toString('hex'),
                    event.preview.manifest?.name || '',
                    domain,
                    event.preview.manifest?.iconUrl || '',
                    event.preview.manifest?.description || '',
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

                this.analyticsApi?.sendEvents([
                    {
                        event_name: 'wallet-connect-accepted',
                        trace_id: event.traceId,
                        client_environment: 'wallet',
                        subsystem: getEventsSubsystem(),
                        network_id: this.walletKitOptions.network,
                        wallet_app_name: this.walletKitOptions.deviceInfo?.appName,
                        wallet_app_version: this.walletKitOptions.deviceInfo?.appVersion,
                        event_id: uuidv7(),
                        origin_url: event.dAppInfo?.url,
                        dapp_name: event.dAppInfo?.name,
                        client_id: event.from,
                        is_ton_addr: event.request.some((item) => item.name === 'ton_addr'),
                        is_ton_proof: event.request.some((item) => item.name === 'ton_proof'),
                        manifest_json_url: event.preview.manifest?.url,
                        proof_payload_size: event.request.find((item) => item.name === 'ton_proof')?.payload?.length,
                        client_timestamp: getUnixtime(),
                        version: getVersion(),
                    },
                    {
                        event_name: 'wallet-connect-response-sent',
                        trace_id: event.traceId,
                        client_environment: 'wallet',
                        subsystem: getEventsSubsystem(),
                        client_id: event.from,
                        client_timestamp: getUnixtime(),
                        version: getVersion(),
                        dapp_name: event.dAppInfo?.name,
                        origin_url: event.dAppInfo?.url,
                        is_ton_addr: event.request.some((item) => item.name === 'ton_addr'),
                        is_ton_proof: event.request.some((item) => item.name === 'ton_proof'),
                        manifest_json_url: event.preview.manifest?.url,
                        proof_payload_size: event.request.find((item) => item.name === 'ton_proof')?.payload?.length,
                        event_id: uuidv7(),
                        network_id: this.walletKitOptions.network,
                        wallet_app_name: this.walletKitOptions.deviceInfo?.appName,
                        wallet_app_version: this.walletKitOptions.deviceInfo?.appVersion,
                    },
                ]);
            } else if ('result' in event) {
                if (!event.walletAddress) {
                    const error = new WalletKitError(
                        ERROR_CODES.WALLET_REQUIRED,
                        'Wallet is required for connect approval result',
                        undefined,
                        { eventId: event.id },
                    );
                    throw error;
                }

                const wallet = this.walletManager.getWallet(event.walletAddress);
                if (!wallet) {
                    const error = new WalletKitError(
                        ERROR_CODES.WALLET_NOT_FOUND,
                        'Wallet not found for connect approval result',
                        undefined,
                        { walletAddress: event.walletAddress, eventId: event.id },
                    );
                    throw error;
                }

                // If event is EventConnectApproval, we need to send response to dApp and create session
                const url = new URL(event.result.dAppUrl);
                const domain = url.host;
                await this.sessionManager.createSession(
                    event.from || (await getSecureRandomBytes(32)).toString('hex'),
                    event.result.dAppName,
                    domain,
                    event.result.dAppIconUrl,
                    event.result.dAppDescription,
                    wallet,
                );
                await this.bridgeManager.sendResponse(event, event.result.response);
                this.analyticsApi?.sendEvents([
                    {
                        event_name: 'wallet-connect-accepted',
                        trace_id: event.traceId,
                        client_environment: 'wallet',
                        subsystem: getEventsSubsystem(),
                        network_id: this.walletKitOptions.network,
                        wallet_app_name: this.walletKitOptions.deviceInfo?.appName,
                        wallet_app_version: this.walletKitOptions.deviceInfo?.appVersion,
                        event_id: uuidv7(),
                        client_id: event.from,
                        is_ton_addr: event.result.response.payload.items.some((item) => item.name === 'ton_addr'),
                        is_ton_proof: event.result.response.payload.items.some((item) => item.name === 'ton_proof'),
                        manifest_json_url: event.result.dAppUrl,
                        proof_payload_size: (
                            event.result.response.payload.items.find(
                                (item) => item.name === 'ton_proof',
                            ) as TonProofItemReplySuccess
                        )?.proof?.payload?.length,
                        client_timestamp: getUnixtime(),
                        version: getVersion(),
                        dapp_name: event.result.dAppName,
                        origin_url: event.result.dAppUrl,
                    },
                    {
                        event_name: 'wallet-connect-response-sent',
                        trace_id: event.traceId,
                        client_environment: 'wallet',
                        subsystem: getEventsSubsystem(),
                        client_id: event.from,
                        client_timestamp: getUnixtime(),
                        version: getVersion(),
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
                        event_id: uuidv7(),
                        network_id: this.walletKitOptions.network,
                        wallet_app_name: this.walletKitOptions.deviceInfo?.appName,
                        wallet_app_version: this.walletKitOptions.deviceInfo?.appVersion,
                    },
                ]);
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
        event: EventConnectRequest,
        reason?: string,
        errorCode?: CONNECT_EVENT_ERROR_CODES,
    ): Promise<void> {
        try {
            log.info('Connect request rejected', {
                id: event.id,
                dAppName: event.preview.manifest?.name || '',
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
                event.preview.manifest?.name || '',
                '',
                '',
                '',
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

            this.analyticsApi?.sendEvents([
                {
                    event_name: 'wallet-connect-rejected',
                    trace_id: event.traceId,
                    client_environment: 'wallet',
                    subsystem: getEventsSubsystem(),
                    dapp_name: event.preview.manifest?.name || '',
                    origin_url: event.preview.manifest?.url || '',
                    manifest_json_url: event.preview.manifest?.url || '',
                    event_id: uuidv7(),
                    client_timestamp: getUnixtime(),
                    version: getVersion(),
                    network_id: this.walletKitOptions.network,
                    wallet_app_name: this.walletKitOptions.deviceInfo?.appName,
                    wallet_app_version: this.walletKitOptions.deviceInfo?.appVersion,
                    is_ton_addr: event.request.some((item) => item.name === 'ton_addr'),
                    is_ton_proof: event.request.some((item) => item.name === 'ton_proof'),
                    proof_payload_size: event.request.find((item) => item.name === 'ton_proof')?.payload?.length,
                    client_id: event.from,
                },
                {
                    event_name: 'wallet-connect-response-sent',
                    trace_id: event.traceId,
                    client_environment: 'wallet',
                    subsystem: getEventsSubsystem(),
                    dapp_name: event.preview.manifest?.name || '',
                    origin_url: event.preview.manifest?.url || '',
                    manifest_json_url: event.preview.manifest?.url || '',
                    event_id: uuidv7(),
                    client_timestamp: getUnixtime(),
                    version: getVersion(),
                    network_id: this.walletKitOptions.network,
                    wallet_app_name: this.walletKitOptions.deviceInfo?.appName,
                    wallet_app_version: this.walletKitOptions.deviceInfo?.appVersion,
                    is_ton_addr: event.request.some((item) => item.name === 'ton_addr'),
                    is_ton_proof: event.request.some((item) => item.name === 'ton_proof'),
                    proof_payload_size: event.request.find((item) => item.name === 'ton_proof')?.payload?.length,
                    client_id: event.from,
                },
            ]);
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
        event: EventTransactionRequest | EventTransactionApproval,
    ): Promise<EventTransactionResponse> {
        try {
            if ('result' in event) {
                if (!this.walletKitOptions.dev?.disableNetworkSend) {
                    await CallForSuccess(() => this.client.sendBoc(Buffer.from(event.result.signedBoc, 'base64')));
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
                    await CallForSuccess(() => this.client.sendBoc(Buffer.from(signedBoc, 'base64')));
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
        event: EventTransactionRequest | EventTransactionApproval,
        signedBoc: string,
    ): void {
        this.analyticsApi?.sendEvents([
            {
                event_name: 'wallet-transaction-accepted',
                trace_id: event.traceId,
                client_environment: 'wallet',
                subsystem: getEventsSubsystem(),
                event_id: uuidv7(),
                client_timestamp: getUnixtime(),
                version: getVersion(),
                network_id: this.walletKitOptions.network,
                wallet_app_name: this.walletKitOptions.deviceInfo?.appName,
                wallet_app_version: this.walletKitOptions.deviceInfo?.appVersion,
                client_id: event.from,
                wallet_id: event.walletAddress ? Base64Normalize(event.walletAddress) : undefined,
                dapp_name: 'dAppInfo' in event ? event.dAppInfo?.name : undefined,
                origin_url: 'dAppInfo' in event ? event.dAppInfo?.url : undefined,
            },
            {
                event_name: 'wallet-transaction-sent',
                trace_id: event.traceId,
                client_environment: 'wallet',
                subsystem: getEventsSubsystem(),
                event_id: uuidv7(),
                network_id: this.walletKitOptions.network,
                wallet_app_name: this.walletKitOptions.deviceInfo?.appName,
                wallet_app_version: this.walletKitOptions.deviceInfo?.appVersion,
                version: getVersion(),
                client_timestamp: getUnixtime(),
                client_id: event.from,
                signed_boc: signedBoc,
            },
        ]);
    }

    /**
     * Process transaction request rejection
     */
    async rejectTransactionRequest(
        event: EventTransactionRequest,
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
            this.analyticsApi?.sendEvents([
                {
                    event_name: 'wallet-transaction-declined',
                    trace_id: event.traceId,
                    client_environment: 'wallet',
                    subsystem: getEventsSubsystem(),
                    dapp_name: event.dAppInfo?.name,
                    origin_url: event.dAppInfo?.url,
                    event_id: uuidv7(),
                    network_id: this.walletKitOptions.network,
                    wallet_app_name: this.walletKitOptions.deviceInfo?.appName,
                    wallet_app_version: this.walletKitOptions.deviceInfo?.appVersion,
                    wallet_id: event.walletAddress ? Base64Normalize(event.walletAddress) : undefined,
                    version: getVersion(),
                    client_timestamp: getUnixtime(),
                    client_id: event.from,
                },
            ]);
            return;
        } catch (error) {
            log.error('Failed to reject transaction request', { error });
            throw error;
        }
    }

    /**
     * Process sign data request approval
     */
    async approveSignDataRequest(event: EventSignDataRequest | EventSignDataApproval): Promise<EventSignDataResponse> {
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
                this.analyticsApi?.sendEvents([
                    {
                        event_name: 'wallet-sign-data-accepted',
                        trace_id: event.traceId,
                        client_environment: 'wallet',
                        subsystem: getEventsSubsystem(),
                        event_id: uuidv7(),
                        network_id: this.walletKitOptions.network,
                        wallet_app_name: this.walletKitOptions.deviceInfo?.appName,
                        wallet_app_version: this.walletKitOptions.deviceInfo?.appVersion,
                        wallet_id: event.walletAddress ? Base64Normalize(event.walletAddress) : undefined,
                        version: getVersion(),
                        client_timestamp: getUnixtime(),
                        client_id: event.from,
                    },
                    {
                        event_name: 'wallet-sign-data-sent',
                        trace_id: event.traceId,
                        client_environment: 'wallet',
                        subsystem: getEventsSubsystem(),
                        event_id: uuidv7(),
                        network_id: this.walletKitOptions.network,
                        wallet_app_name: this.walletKitOptions.deviceInfo?.appName,
                        wallet_app_version: this.walletKitOptions.deviceInfo?.appVersion,
                        wallet_id: event.walletAddress ? Base64Normalize(event.walletAddress) : undefined,
                        version: getVersion(),
                        client_timestamp: getUnixtime(),
                        client_id: event.from,
                    },
                ]);
                return { signature: asHex(event.result.signature) };
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

                if (!event.walletAddress) {
                    const error = new WalletKitError(
                        ERROR_CODES.WALLET_REQUIRED,
                        'Wallet address is required for sign data request',
                        undefined,
                        { eventId: event.id },
                    );
                    throw error;
                }

                const wallet = this.walletManager.getWallet(event.walletAddress);
                if (!wallet) {
                    const error = new WalletKitError(
                        ERROR_CODES.WALLET_NOT_FOUND,
                        'Wallet not found for sign data request',
                        undefined,
                        { walletAddress: event.walletAddress, eventId: event.id },
                    );
                    throw error;
                }
                // Sign data with wallet
                const signData = PrepareTonConnectData({
                    payload: event.request,
                    domain: event.domain,
                    address: event.walletAddress,
                });
                const signature = await wallet.getSignedSignData(signData);
                const signatureBase64 = Buffer.from(signature.slice(2), 'hex').toString('base64');

                // Send approval response
                const response: SignDataRpcResponseSuccess = {
                    id: event.id,
                    result: {
                        signature: signatureBase64,
                        address: Address.parse(signData.address).toRawString(),
                        timestamp: signData.timestamp,
                        domain: signData.domain,
                        payload: signData.payload,
                    },
                };

                await this.bridgeManager.sendResponse(event, response);
                this.analyticsApi?.sendEvents([
                    {
                        event_name: 'wallet-sign-data-accepted',
                        trace_id: event.traceId,
                        client_environment: 'wallet',
                        subsystem: getEventsSubsystem(),
                        dapp_name: event.dAppInfo?.name,
                        origin_url: event.dAppInfo?.url,
                        event_id: uuidv7(),
                        network_id: this.walletKitOptions.network,
                        wallet_app_name: this.walletKitOptions.deviceInfo?.appName,
                        wallet_app_version: this.walletKitOptions.deviceInfo?.appVersion,
                        wallet_id: event.walletAddress ? Base64Normalize(event.walletAddress) : undefined,
                        version: getVersion(),
                        client_timestamp: getUnixtime(),
                        client_id: event.from,
                    },
                    {
                        event_name: 'wallet-sign-data-sent',
                        trace_id: event.traceId,
                        client_environment: 'wallet',
                        subsystem: getEventsSubsystem(),
                        dapp_name: event.dAppInfo?.name,
                        origin_url: event.dAppInfo?.url,
                        event_id: uuidv7(),
                        network_id: this.walletKitOptions.network,
                        wallet_app_name: this.walletKitOptions.deviceInfo?.appName,
                        wallet_app_version: this.walletKitOptions.deviceInfo?.appVersion,
                        wallet_id: event.walletAddress ? Base64Normalize(event.walletAddress) : undefined,
                        version: getVersion(),
                        client_timestamp: getUnixtime(),
                        client_id: event.from,
                    },
                ]);
                return { signature: asHex(signature) };
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
    async rejectSignDataRequest(event: EventSignDataRequest, reason?: string): Promise<void> {
        try {
            const response = {
                error: 'USER_REJECTED',
                reason: reason || 'User rejected data signing',
            };

            await this.bridgeManager.sendResponse(event, response);
            this.analyticsApi?.sendEvents([
                {
                    event_name: 'wallet-sign-data-declined',
                    trace_id: event.traceId,
                    client_environment: 'wallet',
                    subsystem: getEventsSubsystem(),
                    dapp_name: event.dAppInfo?.name,
                    origin_url: event.dAppInfo?.url,
                    event_id: uuidv7(),
                    network_id: this.walletKitOptions.network,
                    wallet_app_name: this.walletKitOptions.deviceInfo?.appName,
                    wallet_app_version: this.walletKitOptions.deviceInfo?.appVersion,
                    wallet_id: event.walletAddress ? Base64Normalize(event.walletAddress) : undefined,
                    version: getVersion(),
                    client_timestamp: getUnixtime(),
                    client_id: event.from,
                },
            ]);
            return;
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
            throw new WalletKitError(
                ERROR_CODES.WALLET_REQUIRED,
                'Wallet address is required for connect approval response',
                undefined,
                { eventId: event.id },
            );
        }
        const wallet = this.walletManager.getWallet(walletAddress);
        if (!wallet) {
            throw new WalletKitError(
                ERROR_CODES.WALLET_NOT_FOUND,
                'Wallet not found for connect approval response',
                undefined,
                { walletAddress, eventId: event.id },
            );
        }

        // Get wallet state init as base64 BOC
        const walletStateInit = await wallet.getStateInit();

        // Get public key as hex string
        const publicKey = wallet.getPublicKey().replace('0x', '');

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
                lengthBytes: 0,
                value: '',
            };
            try {
                const dAppUrl = new URL(event.preview.manifest?.url || '');
                domain = {
                    lengthBytes: Buffer.from(dAppUrl.host).length,
                    value: dAppUrl.host,
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
                    payload: proofItem.payload,
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
    private async signTransaction(event: EventTransactionRequest): Promise<string> {
        if (!event.walletAddress) {
            throw new WalletKitError(
                ERROR_CODES.WALLET_REQUIRED,
                'Wallet address is required for transaction signing',
                undefined,
                { eventId: event.id },
            );
        }
        const wallet = this.walletManager.getWallet(event.walletAddress);
        if (!wallet) {
            throw new WalletKitError(
                ERROR_CODES.WALLET_NOT_FOUND,
                'Wallet not found for transaction signing',
                undefined,
                { walletAddress: event.walletAddress, eventId: event.id },
            );
        }
        return await signTransactionInternal(wallet, event.request);
    }
}

/**
 * Internal helper to sign transaction
 */
export async function signTransactionInternal(
    wallet: IWallet,
    request: ConnectTransactionParamContent,
): Promise<string> {
    const signedBoc = await wallet.getSignedSendTransaction(request, {
        fakeSignature: false,
    });

    log.debug('Signing transaction', {
        messagesCount: request.messages.length,
        from: request.from,
        validUntil: request.valid_until,
    });

    return signedBoc;
}
