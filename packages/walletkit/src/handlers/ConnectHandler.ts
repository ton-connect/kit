// Connect request handler

import { ConnectItem } from '@tonconnect/protocol';

import type { EventConnectRequest } from '../types';
import type { RawBridgeEvent, EventHandler, RawBridgeEventConnect } from '../types/internal';
import { sanitizeString } from '../validation/sanitization';
import { globalLogger } from '../core/Logger';
import { BasicHandler } from './BasicHandler';
import { WalletKitError, ERROR_CODES } from '../errors';

const log = globalLogger.createChild('ConnectHandler');

export class ConnectHandler
    extends BasicHandler<EventConnectRequest>
    implements EventHandler<EventConnectRequest, RawBridgeEventConnect>
{
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

        const connectEvent: EventConnectRequest = {
            ...event,
            id: event.id,
            request: event.params?.items || [],
            preview: this.createPreview(event, manifestUrl, manifest),
            isJsBridge: event.isJsBridge,
            tabId: event.tabId,
        };

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

        return sanitizeString(name);
    }

    /**
     * Extract manifest URL from bridge event
     */
    private extractManifestUrl(event: RawBridgeEventConnect): string {
        const url = event.params?.manifest?.url ?? event.params?.manifestUrl ?? '';

        return sanitizeString(url);
    }

    /**
     * Create preview object for connect request
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private createPreview(event: RawBridgeEventConnect, manifestUrl: string, fetchedManifest?: any): any {
        const eventManifest = event.params?.manifest;
        const manifest = fetchedManifest || eventManifest;

        const dAppUrl = manifest?.url || manifestUrl || '';

        const sanitizedManifest = manifest && {
            name: sanitizeString(manifest.name || ''),
            description: sanitizeString(manifest.description || ''),
            url: sanitizeString(manifest.url || ''),
            iconUrl: sanitizeString(manifest.iconUrl || ''),

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
                description: 'Gives dApp signature, that can be used to verify your identity',
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
