// Connect request handler

import { ConnectItem } from '@tonconnect/protocol';

import type { EventConnectRequest } from '../types';
import type { RawBridgeEvent, EventHandler, RawBridgeEventConnect } from '../types/internal';
import { sanitizeString } from '../validation/sanitization';
import { globalLogger } from '../core/Logger';
import { BasicHandler } from './BasicHandler';

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
            dAppName: this.extractDAppName(event, manifest),
            dAppUrl: manifest?.url || '',
            manifestUrl,
            request: event.params?.items || [],
            preview: this.createPreview(event, manifest),
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
            // event.params?.dAppName ||
            // event.params?.name ||
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
    private createPreview(event: RawBridgeEventConnect, fetchedManifest?: any): any {
        const eventManifest = event.params?.manifest;
        const manifest = fetchedManifest || eventManifest;

        const sanitizedManifest = manifest && {
            name: sanitizeString(manifest.name || ''),
            description: sanitizeString(manifest.description || ''),
            url: sanitizeString(manifest.url || ''),
            iconUrl: sanitizeString(manifest.iconUrl || ''),
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
            manifest: manifest ? sanitizedManifest : null,
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
            throw new Error(`Failed to fetch manifest: ${response.statusText}`);
        }
        return response.json();
    }
}
