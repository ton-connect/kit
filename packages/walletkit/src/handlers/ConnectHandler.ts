// Connect request handler

import { ConnectItem } from '@tonconnect/protocol';

import type { ConnectPreview, EventConnectRequest, TonWalletKitOptions } from '../types';
import type { RawBridgeEvent, EventHandler, RawBridgeEventConnect } from '../types/internal';
import { globalLogger } from '../core/Logger';
import { BasicHandler } from './BasicHandler';
import { WalletKitError, ERROR_CODES } from '../errors';
import { AnalyticsApi } from '../analytics/sender';
import { getUnixtime } from '../utils/time';
import { uuidv7 } from '../utils/uuid';
import { getEventsSubsystem, getVersion } from '../utils/version';

const log = globalLogger.createChild('ConnectHandler');

export class ConnectHandler
    extends BasicHandler<EventConnectRequest>
    implements EventHandler<EventConnectRequest, RawBridgeEventConnect>
{
    private analyticsApi?: AnalyticsApi;
    private walletKitConfig: TonWalletKitOptions;

    constructor(
        notify: (event: EventConnectRequest) => void,
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

    async handle(event: RawBridgeEventConnect): Promise<EventConnectRequest> {
        // Extract manifest information
        const manifestUrl = this.extractManifestUrl(event);
        let manifest = null;

        // Try to fetch manifest if URL is available
        if (manifestUrl) {
            try {
                manifest = await this.fetchManifest(manifestUrl);
            } catch (error) {
                log.warn('Failed to fetch manifest', { error });
            }
        }

        const preview = this.createPreview(event, manifestUrl, manifest);

        const connectEvent: EventConnectRequest = {
            ...event,
            id: event.id,

            request: event.params?.items || [],
            preview,
            dAppInfo: {
                name: preview?.manifest?.name,
                description: preview?.manifest?.description,
                url: preview?.manifest?.url,
                iconUrl: preview?.manifest?.iconUrl,
            },
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
                manifest_json_url: manifestUrl || preview?.manifest?.url,
                is_ton_addr: event.params?.items?.some((item) => item.name === 'ton_addr') || false,
                is_ton_proof: event.params?.items?.some((item) => item.name === 'ton_proof') || false,
                client_timestamp: getUnixtime(),
                event_id: uuidv7(),
                // network_id: event.network,
                version: getVersion(),
                proof_payload_size: event.params?.items?.some((item) => item.name === 'ton_proof')
                    ? event.params?.items?.find((item) => item.name === 'ton_proof')?.payload?.length
                    : 0,
                wallet_app_name: this.walletKitConfig.deviceInfo?.appName,
                wallet_app_version: this.walletKitConfig.deviceInfo?.appVersion,
                network_id: this.walletKitConfig.network,
            },
        ]);

        return connectEvent;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private createPreview(event: RawBridgeEventConnect, manifestUrl: string, fetchedManifest?: any): ConnectPreview {
        const eventManifest = event.params?.manifest;
        const manifest = fetchedManifest || eventManifest;

        const dAppUrl = manifest?.url || manifestUrl || '';

        const sanitizedManifest = manifest && {
            name: manifest.name?.toString()?.trim() || '',
            description: manifest.description?.toString()?.trim() || '',
            url: manifest.url?.toString()?.trim() || '',
            iconUrl: manifest.iconUrl?.toString()?.trim() || '',

            dAppName: this.extractDAppName(event, manifest),
            dAppUrl: dAppUrl,

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
            manifest: sanitizedManifest,
            requestedItems: event.params?.items || [],
            permissions: permissions,
        };
    }

    /**
     * Fetch manifest from URL
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async fetchManifest(manifestUrl: string): Promise<any> {
        const response = await fetch(manifestUrl);
        if (!response.ok) {
            throw new WalletKitError(
                ERROR_CODES.API_REQUEST_FAILED,
                `Failed to fetch manifest: ${response.statusText}`,
                undefined,
                { manifestUrl, status: response.status, statusText: response.statusText },
            );
        }
        return response.json();
    }
}
