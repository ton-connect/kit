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

import type { TonWalletKitOptions } from '../types';
import type { RawBridgeEvent, EventHandler, RawBridgeEventSignData } from '../types/internal';
import { BasicHandler } from './BasicHandler';
import { globalLogger } from '../core/Logger';
import { validateSignDataPayload } from '../validation/signData';
import { WalletKitError, ERROR_CODES } from '../errors';
import type { AnalyticsApi } from '../analytics/sender';
import { uuidv7 } from '../utils/uuid';
import { getUnixtime } from '../utils/time';
import { getEventsSubsystem, getVersion } from '../utils/version';
import { Base64Normalize } from '../utils/base64';
import type { WalletManager } from '../core/WalletManager';
import { getAddressFromWalletId } from '../utils/walletId';
import type { SignDataPayload, SignData, SignDataRequestEvent, SignDataPreview, Base64String } from '../api/models';
import { Network } from '../api/models';
import { asMaybeAddressFriendly } from '../utils/address';

const log = globalLogger.createChild('SignDataHandler');

export class SignDataHandler
    extends BasicHandler<SignDataRequestEvent>
    implements EventHandler<SignDataRequestEvent, RawBridgeEventSignData>
{
    private analyticsApi?: AnalyticsApi;
    private walletKitConfig: TonWalletKitOptions;
    private walletManager: WalletManager;

    constructor(
        notify: (event: SignDataRequestEvent) => void,
        walletKitConfig: TonWalletKitOptions,
        walletManager: WalletManager,
        analyticsApi?: AnalyticsApi,
    ) {
        super(notify);
        this.walletKitConfig = walletKitConfig;
        this.walletManager = walletManager;
        this.analyticsApi = analyticsApi;
    }

    canHandle(event: RawBridgeEvent): event is RawBridgeEventSignData {
        return event.method === 'signData';
    }

    async handle(event: RawBridgeEventSignData): Promise<SignDataRequestEvent> {
        // Support both walletId (new) and walletAddress (legacy)
        const walletId = event.walletId;
        const walletAddress = event.walletAddress ?? (walletId ? getAddressFromWalletId(walletId) : undefined);

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

        // Send wallet-sign-data-request-received event
        this.analyticsApi?.sendEvents([
            {
                event_name: 'wallet-sign-data-request-received',
                trace_id: event.traceId ?? uuidv7(),
                client_environment: 'wallet',
                subsystem: getEventsSubsystem(),
                client_id: event.from,
                wallet_id: walletAddress ? Base64Normalize(walletAddress) : undefined,
                client_timestamp: getUnixtime(),
                dapp_name: event.dAppInfo?.name,
                version: getVersion(),
                network_id: wallet?.getNetwork().chainId,
                wallet_app_name: this.walletKitConfig.deviceInfo?.appName,
                wallet_app_version: this.walletKitConfig.deviceInfo?.appVersion,
                event_id: uuidv7(),
                // manifest_json_url: event.dAppInfo?.url, // todo
                origin_url: event.dAppInfo?.url,
            },
        ]);

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
                fromAddress: asMaybeAddressFriendly(parsed.from) ?? undefined,
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
