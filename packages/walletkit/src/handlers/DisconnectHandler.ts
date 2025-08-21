// Disconnect event handler

import type { WalletInterface, EventDisconnect } from '../types';
import type { RawBridgeEvent, RequestContext, EventHandler, RawBridgeEventGeneric } from '../types/internal';

export class DisconnectHandler implements EventHandler<EventDisconnect> {
    canHandle(event: RawBridgeEvent): boolean {
        return (
            event.method === 'disconnect' ||
            event.method === 'tonconnect_disconnect' ||
            event.method === 'wallet_disconnect'
        );
    }

    async handle(event: RawBridgeEvent, context: RequestContext): Promise<EventDisconnect> {
        const reason = this.extractDisconnectReason(event);

        const disconnectEvent: EventDisconnect = {
            reason,
            wallet: context.wallet || this.createPlaceholderWallet(),
        };

        return disconnectEvent;
    }

    /**
     * Extract disconnect reason from bridge event
     */
    private extractDisconnectReason(event: RawBridgeEventGeneric): string | undefined {
        const params = event.params || {};

        // Check various possible fields for reason
        const reason = params.reason || params.message || params.error || params.cause;

        if (typeof reason === 'string' && reason.length > 0) {
            return reason.slice(0, 200); // Limit length
        }

        // No specific reason provided
        return undefined;
    }

    /**
     * Create placeholder wallet
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
