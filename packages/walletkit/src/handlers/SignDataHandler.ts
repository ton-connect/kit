/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Sign data request handler

import type { SignDataPayload as TonConnectSignDataPayload } from '@tonconnect/protocol';
import { parseTLB } from '@ton-community/tlb-runtime';

import type { RawBridgeEvent, EventHandler, RawBridgeEventSignData } from '../types/internal';
import { BasicHandler } from './BasicHandler';
import { globalLogger } from '../core/Logger';
import { validateSignDataPayload } from '../validation/signData';
import { WalletKitError, ERROR_CODES } from '../errors';
import type { WalletManager } from '../core/WalletManager';
import type { SignDataPayload, SignData, SignDataRequestEvent, SignDataPreview, Base64String } from '../api/models';
import { Network } from '../api/models';
import type { Analytics, AnalyticsManager } from '../analytics';
import type { SessionManager } from '../core/SessionManager';

const log = globalLogger.createChild('SignDataHandler');

export class SignDataHandler
    extends BasicHandler<SignDataRequestEvent>
    implements EventHandler<SignDataRequestEvent, RawBridgeEventSignData>
{
    private analytics?: Analytics;
    private walletManager: WalletManager;
    private sessionManager: SessionManager;

    constructor(
        notify: (event: SignDataRequestEvent) => void,
        walletManager: WalletManager,
        sessionManager: SessionManager,
        analyticsManager?: AnalyticsManager,
    ) {
        super(notify);
        this.walletManager = walletManager;
        this.sessionManager = sessionManager;
        this.analytics = analyticsManager?.scoped();
    }

    canHandle(event: RawBridgeEvent): event is RawBridgeEventSignData {
        return event.method === 'signData';
    }

    async handle(event: RawBridgeEventSignData): Promise<SignDataRequestEvent> {
        // Support both walletId (new) and walletAddress (legacy)
        const walletId = event.walletId;
        const walletAddress = event.walletAddress;

        if (!walletId && !walletAddress) {
            throw new WalletKitError(ERROR_CODES.WALLET_REQUIRED, 'No wallet ID found in sign data event', undefined, {
                eventId: event.id,
            });
        }

        // Try to get wallet by walletId first, fall back to address search
        const wallet = walletId ? this.walletManager.getWallet(walletId) : undefined;

        const payload = this.parseDataToSign(event);
        if (!payload) {
            log.error('No data to sign found in request', { event });
            throw new WalletKitError(ERROR_CODES.INVALID_REQUEST_EVENT, 'No data to sign found in request', undefined, {
                eventId: event.id,
            });
        }
        const preview = this.createDataPreview(payload.data, event);
        if (!preview) {
            log.error('No preview found for data', { data: payload });
            throw new WalletKitError(
                ERROR_CODES.RESPONSE_CREATION_FAILED,
                'Failed to create preview for sign data request',
                undefined,
                { eventId: event.id, data: payload },
            );
        }

        const signEvent: SignDataRequestEvent = {
            ...event,
            payload: payload,
            preview: {
                dAppInfo: event.dAppInfo ?? {},
                data: preview,
            },
            dAppInfo: event.dAppInfo ?? {},
            walletId: walletId ?? (wallet ? this.walletManager.getWalletId(wallet) : ''),
            walletAddress: walletAddress ?? wallet?.getAddress() ?? undefined,
        };

        if (this.analytics) {
            const sessionData = event.from ? await this.sessionManager.getSession(event.from) : undefined;

            // Send wallet-sign-data-request-received event
            this.analytics?.emitWalletSignDataRequestReceived({
                trace_id: event.traceId,
                client_id: event.from,
                wallet_id: sessionData?.publicKey,
                dapp_name: event.dAppInfo?.name,
                network_id: wallet?.getNetwork().chainId,
                // manifest_json_url: event.dAppInfo?.url, // todo
                origin_url: event.dAppInfo?.url,
            });
        }

        return signEvent;
    }

    /**
     * Parse data to sign from bridge event
     */
    private parseDataToSign(event: RawBridgeEventSignData): SignDataPayload | undefined {
        try {
            const parsed = JSON.parse(event.params[0]) as TonConnectSignDataPayload;

            const validationResult = validateSignDataPayload(parsed);

            if (validationResult) {
                log.error('Invalid data to sign found in request', { validationResult });
                return undefined;
            }

            if (parsed === undefined) {
                return undefined;
            }

            let signData: SignData;

            if (parsed.type === 'text') {
                signData = {
                    type: 'text',
                    value: {
                        content: parsed.text,
                    },
                };
            } else if (parsed.type === 'binary') {
                signData = {
                    type: 'binary',
                    value: {
                        content: parsed.bytes as Base64String,
                    },
                };
            } else if (parsed.type === 'cell') {
                signData = {
                    type: 'cell',
                    value: {
                        schema: parsed.schema,
                        content: parsed.cell as Base64String,
                    },
                };
            } else {
                return undefined;
            }

            return {
                network: parsed.network ? Network.custom(parsed.network) : undefined,
                fromAddress: parsed.from,
                data: signData,
            };
        } catch (error) {
            log.error('Invalid data to sign found in request', { error });
            return undefined;
        }
    }

    /**
     * Create human-readable preview of data to sign
     */
    private createDataPreview(data: SignData, _event: RawBridgeEvent): SignDataPreview | undefined {
        if (data.type === 'text') {
            return {
                type: 'text',
                value: {
                    content: data.value.content,
                },
            };
        }

        if (data.type === 'binary') {
            return {
                type: 'binary',
                value: {
                    content: data.value.content,
                },
            };
        }

        if (data.type === 'cell') {
            try {
                const parsed = parseTLB(data.value.schema).deserialize(data.value.content) as unknown as Record<
                    string,
                    unknown
                >;
                return {
                    type: 'cell',
                    value: {
                        schema: data.value.schema,
                        content: data.value.content,
                        parsed,
                    },
                };
            } catch (error) {
                log.error('Error deserializing cell', { error });
                return {
                    type: 'cell',
                    value: {
                        schema: data.value.schema,
                        content: data.value.content,
                    },
                };
            }
        }

        return undefined;
    }
}
