/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Sign data request handler

import { SignDataPayload } from '@tonconnect/protocol';
import { parseTLB } from '@ton-community/tlb-runtime';

import type { EventSignDataRequest, SignDataPreview, TonWalletKitOptions } from '../types';
import type { RawBridgeEvent, EventHandler, RawBridgeEventSignData } from '../types/internal';
import { BasicHandler } from './BasicHandler';
import { globalLogger } from '../core/Logger';
import { validateSignDataPayload } from '../validation/signData';
import { WalletKitError, ERROR_CODES } from '../errors';
import { AnalyticsApi } from '../analytics/sender';
import { uuidv7 } from '../utils/uuid';
import { getUnixtime } from '../utils/time';
import { getEventsSubsystem, getVersion } from '../utils/version';
import { Base64Normalize } from '../utils/base64';
import { WalletManager } from '../core/WalletManager';
import { getAddressFromWalletId } from '../utils/walletId';

const log = globalLogger.createChild('SignDataHandler');

export class SignDataHandler
    extends BasicHandler<EventSignDataRequest>
    implements EventHandler<EventSignDataRequest, RawBridgeEventSignData>
{
    private analyticsApi?: AnalyticsApi;
    private walletKitConfig: TonWalletKitOptions;
    private walletManager: WalletManager;

    constructor(
        notify: (event: EventSignDataRequest) => void,
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

    async handle(event: RawBridgeEventSignData): Promise<EventSignDataRequest> {
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

        const data = this.parseDataToSign(event);
        if (!data) {
            log.error('No data to sign found in request', { event });
            throw new WalletKitError(ERROR_CODES.INVALID_REQUEST_EVENT, 'No data to sign found in request', undefined, {
                eventId: event.id,
            });
        }
        const preview = this.createDataPreview(data, event);
        if (!preview) {
            log.error('No preview found for data', { data });
            throw new WalletKitError(
                ERROR_CODES.RESPONSE_CREATION_FAILED,
                'Failed to create preview for sign data request',
                undefined,
                { eventId: event.id, data },
            );
        }

        const signEvent: EventSignDataRequest = {
            ...event,
            request: data,
            preview,
            dAppInfo: event.dAppInfo ?? {},
            walletId: walletId ?? (wallet ? this.walletManager.getWalletId(wallet) : ''),
            walletAddress: walletAddress ?? wallet?.getAddress() ?? '',
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
                network_id: wallet?.getNetwork(),
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
            const parsed = JSON.parse(event.params[0]) as SignDataPayload;

            const validationResult = validateSignDataPayload(parsed);

            if (validationResult) {
                log.error('Invalid data to sign found in request', { validationResult });
                return undefined;
            }

            return parsed;
        } catch (error) {
            log.error('Invalid data to sign found in request', { error });
            return undefined;
        }
    }

    /**
     * Create human-readable preview of data to sign
     */
    private createDataPreview(data: SignDataPayload, _event: RawBridgeEvent): SignDataPreview | undefined {
        if (data.type === 'text') {
            return {
                kind: 'text',
                content: data.text,
            };
        }

        if (data.type === 'binary') {
            return {
                kind: 'binary',
                content: data.bytes,
            };
        }

        if (data.type === 'cell') {
            if (!data.schema) {
                return {
                    kind: 'cell',
                    content: data.cell,
                };
            }
            try {
                const parsed = parseTLB(data.schema).deserialize(data.cell) as unknown as Record<string, unknown>;
                return {
                    kind: 'cell',
                    schema: data.schema,
                    content: data.cell,
                    parsed,
                };
            } catch (error) {
                log.error('Error deserializing cell', { error });
                return {
                    kind: 'cell',
                    content: data.cell,
                };
            }
        }

        return undefined;
    }
}
