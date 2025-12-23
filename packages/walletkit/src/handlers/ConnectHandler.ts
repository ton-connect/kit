/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Connect request handler

import type { ConnectItem } from '@tonconnect/protocol';
import { CONNECT_EVENT_ERROR_CODES } from '@tonconnect/protocol';

import type { TonWalletKitOptions } from '../types';
import type { RawBridgeEvent, EventHandler, RawBridgeEventConnect } from '../types/internal';
import { globalLogger } from '../core/Logger';
import { BasicHandler } from './BasicHandler';
import type { AnalyticsApi } from '../analytics/sender';
import { getUnixtime } from '../utils/time';
import { uuidv7 } from '../utils/uuid';
import { getEventsSubsystem, getVersion } from '../utils/version';
import { isValidHost } from '../utils/url';
import type {
    ConnectionRequestEvent,
    ConnectionRequestEventPreview,
    ConnectionRequestEventRequestedItem,
} from '../api/models';

const log = globalLogger.createChild('ConnectHandler');

export class ConnectHandler
    extends BasicHandler<ConnectionRequestEvent>
    implements EventHandler<ConnectionRequestEvent, RawBridgeEventConnect>
{
    private analyticsApi?: AnalyticsApi;
    private walletKitConfig: TonWalletKitOptions;

    constructor(
        notify: (event: ConnectionRequestEvent) => void,
        walletKitConfig: TonWalletKitOptions,
        analyticsApi?: AnalyticsApi,
    ) {
        super(notify);
        this.analyticsApi = analyticsApi;
        this.walletKitConfig = walletKitConfig;
    }

    canHandle(event: RawBridgeEvent): event is RawBridgeEventConnect {
        return event.method === 'connect';
    }

    async handle(event: RawBridgeEventConnect): Promise<ConnectionRequestEvent> {
        // Extract manifest information
        const manifestUrl = this.extractManifestUrl(event);
        let manifest = null;
        let manifestFetchErrorCode = undefined;

        // Try to fetch manifest if URL is available
        if (manifestUrl) {
            try {
                const result = await this.fetchManifest(manifestUrl);
                manifest = result.manifest;
                manifestFetchErrorCode = result.manifestFetchErrorCode;
            } catch (error) {
                log.warn('Failed to fetch manifest', { error });
            }
        }

        const preview = this.createPreview(event, manifestUrl, manifest, manifestFetchErrorCode);

        const connectEvent: ConnectionRequestEvent = {
            ...event,
            id: event.id,
            requestedItems: event.params.items ? this.toConnectionRequestEventRequestedItems(event.params.items) : [],
            preview,
            dAppInfo: preview.dAppInfo,
            isJsBridge: event.isJsBridge,
            tabId: event.tabId,
        };

        // Send wallet-connect-request-received event
        this.analyticsApi?.sendEvents([
            {
                event_name: 'wallet-connect-request-received',
                trace_id: event.traceId ?? uuidv7(),
                client_environment: 'wallet',
                subsystem: getEventsSubsystem(),
                client_id: event.from,
                manifest_json_url: manifestUrl || preview?.dAppInfo?.manifestUrl,
                is_ton_addr: event.params?.items?.some((item) => item.name === 'ton_addr') || false,
                is_ton_proof: event.params?.items?.some((item) => item.name === 'ton_proof') || false,
                client_timestamp: getUnixtime(),
                event_id: uuidv7(),
                version: getVersion(),
                proof_payload_size: event.params?.items?.some((item) => item.name === 'ton_proof')
                    ? event.params?.items?.find((item) => item.name === 'ton_proof')?.payload?.length
                    : 0,
                wallet_app_name: this.walletKitConfig.deviceInfo?.appName,
                wallet_app_version: this.walletKitConfig.deviceInfo?.appVersion,
            },
        ]);

        return connectEvent;
    }

    private toConnectionRequestEventRequestedItems(items: ConnectItem[]): ConnectionRequestEventRequestedItem[] {
        return items.map((item) => {
            if (item.name === 'ton_addr') {
                return { type: 'ton_addr' };
            } else if (item.name === 'ton_proof') {
                return {
                    type: 'ton_proof',
                    value: {
                        payload: item.payload as string,
                    },
                };
            } else {
                return { type: 'unknown', value: item };
            }
        });
    }

    /**
     * Extract dApp name from bridge event or manifest
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private extractDAppName(event: RawBridgeEvent, manifest?: any): string {
        const name =
            manifest?.name ||
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (event as any).params?.manifest?.name ||
            'Unknown dApp';

        return name?.toString()?.trim();
    }

    /**
     * Extract manifest URL from bridge event
     */
    private extractManifestUrl(event: RawBridgeEventConnect): string {
        const url = event.params?.manifest?.url ?? event.params?.manifestUrl ?? '';

        return url.trim();
    }

    /**
     * Create preview object for connect request
     */

    private createPreview(
        event: RawBridgeEventConnect,
        manifestUrl: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fetchedManifest?: any,
        manifestFetchErrorCode?:
            | CONNECT_EVENT_ERROR_CODES.MANIFEST_NOT_FOUND_ERROR
            | CONNECT_EVENT_ERROR_CODES.MANIFEST_CONTENT_ERROR,
    ): ConnectionRequestEventPreview {
        const eventManifest = event.params?.manifest;
        const manifest = fetchedManifest || eventManifest;

        const dAppUrl = (event?.domain || manifest?.url?.toString() || '').trim();

        // Validate dApp URL from manifest content - set error if invalid
        let finalManifestFetchErrorCode = manifestFetchErrorCode;
        if (!finalManifestFetchErrorCode && dAppUrl) {
            try {
                const parsedDAppUrl = new URL(dAppUrl);
                if (!isValidHost(parsedDAppUrl.host)) {
                    log.warn('Invalid dApp URL in manifest - invalid host format', {
                        dAppUrl,
                        host: parsedDAppUrl.host,
                    });
                    finalManifestFetchErrorCode = CONNECT_EVENT_ERROR_CODES.MANIFEST_CONTENT_ERROR;
                }
            } catch (_) {
                log.warn('Invalid dApp URL in manifest - failed to parse', { dAppUrl });
                finalManifestFetchErrorCode = CONNECT_EVENT_ERROR_CODES.MANIFEST_CONTENT_ERROR;
            }
        }

        const sanitizedManifest = manifest && {
            name: manifest.name?.toString()?.trim() || '',
            description: manifest.description?.toString()?.trim() || '',
            url: dAppUrl,
            iconUrl: manifest.iconUrl?.toString()?.trim() || '',

            manifestUrl: manifestUrl || '',
        };

        const requestedItems = event.params?.items || [];

        const permissions = [];
        const addrItem = requestedItems.find((item: ConnectItem) => item.name === 'ton_addr');
        if (addrItem) {
            permissions.push({
                name: 'ton_addr',
                title: 'TON Address',
                description: 'Gives dApp information about your TON address',
            });
        }

        const proofItem = requestedItems.find((item: ConnectItem) => item.name === 'ton_proof');
        if (proofItem) {
            permissions.push({
                name: 'ton_proof',
                title: 'TON Proof',
                description: 'Gives dApp signature, that can be used to verify your access to private key',
            });
        }

        return {
            permissions: permissions,
            dAppInfo: {
                url: dAppUrl,
                name: sanitizedManifest?.name,
                description: sanitizedManifest?.description,
                iconUrl: sanitizedManifest?.iconUrl,
                manifestUrl: manifestUrl,
            },
            manifestFetchErrorCode: manifestFetchErrorCode ?? undefined,
        };
    }

    /**
     * Fetch manifest from URL
     */

    private async fetchManifest(manifestUrl: string): Promise<{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        manifest: any;
        manifestFetchErrorCode?:
            | CONNECT_EVENT_ERROR_CODES.MANIFEST_NOT_FOUND_ERROR
            | CONNECT_EVENT_ERROR_CODES.MANIFEST_CONTENT_ERROR;
    }> {
        try {
            // try to parse url
            const parsedUrl = new URL(manifestUrl);
            if (!isValidHost(parsedUrl.host)) {
                return {
                    manifest: null,
                    manifestFetchErrorCode: CONNECT_EVENT_ERROR_CODES.MANIFEST_NOT_FOUND_ERROR,
                };
            }
        } catch (_) {
            return {
                manifest: null,
                manifestFetchErrorCode: CONNECT_EVENT_ERROR_CODES.MANIFEST_NOT_FOUND_ERROR,
            };
        }
        try {
            const response = await fetch(manifestUrl);
            if (!response.ok) {
                return {
                    manifest: null,
                    manifestFetchErrorCode: CONNECT_EVENT_ERROR_CODES.MANIFEST_CONTENT_ERROR,
                };
                // throw new WalletKitError(
                //     ERROR_CODES.API_REQUEST_FAILED,
                //     `Failed to fetch manifest: ${response.statusText}`,
                //     undefined,
                //     { manifestUrl, status: response.status, statusText: response.statusText },
                // );
            }
            const result = await response.json();
            return {
                manifest: result,
                manifestFetchErrorCode: undefined,
            };
        } catch (_) {
            return {
                manifest: null,
                manifestFetchErrorCode: CONNECT_EVENT_ERROR_CODES.MANIFEST_CONTENT_ERROR,
            };
        }
    }
}
