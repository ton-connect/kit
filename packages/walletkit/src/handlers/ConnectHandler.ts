// Connect request handler

import type { WalletInterface, EventConnectRequest } from '../types';
import type { RawBridgeEvent, RequestContext, EventHandler, RawBridgeEventConnect } from '../types/internal';
import { sanitizeString } from '../validation/sanitization';

export class ConnectHandler implements EventHandler<EventConnectRequest> {
    canHandle(event: RawBridgeEvent): boolean {
        return (
            event.method === 'start_connect' ||
            event.method === 'tonconnect_connect' ||
            event.method === 'wallet_connect'
        );
    }

    async handle(event: RawBridgeEventConnect, context: RequestContext): Promise<EventConnectRequest> {
        const connectEvent: EventConnectRequest = {
            // manifestUrl: '',
            // items: [],
            // id: event.id,
            // dAppName: this.extractDAppName(event),
            // manifestUrl: this.extractManifestUrl(event),
            // preview: this.createPreview(event),
            // wallet: context.wallet || this.createPlaceholderWallet(),
        } as any;

        return connectEvent;
    }

    /**
     * Extract dApp name from bridge event
     */
    private extractDAppName(event: RawBridgeEvent): string {
        const name = event.params?.manifest?.name || event.params?.dAppName || event.params?.name || 'Unknown dApp';

        return sanitizeString(name);
    }

    /**
     * Extract manifest URL from bridge event
     */
    private extractManifestUrl(event: RawBridgeEvent): string {
        const url = event.params?.manifestUrl || event.params?.manifest?.url || '';

        return sanitizeString(url);
    }

    /**
     * Create preview object for connect request
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private createPreview(event: RawBridgeEventConnect): any {
        const manifest = event.params?.manifest;

        const sanitizedManifest = manifest && {
            name: sanitizeString(manifest.name || ''), //123
            description: sanitizeString(manifest.description || ''),
            url: sanitizeString(manifest.url || ''),
            iconUrl: sanitizeString(manifest.iconUrl || ''),
        };
        return {
            manifest: manifest ? sanitizedManifest : null,
            requestedItems: event.params?.items || [],
            permissions: event.params?.permissions || [],
        };
    }

    /**
     * Create placeholder wallet when no wallet is in context
     */
    private createPlaceholderWallet(): WalletInterface {
        return {
            publicKey: new Uint8Array(0),
            version: '',
            sign: async () => new Uint8Array(0),
            getAddress: () => '',
            getBalance: async () => BigInt(0),
            getStateInit: async () => '',
        };
    }
}
