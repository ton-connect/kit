// Disconnect event handler

import { SessionManager } from '../core/SessionManager';
import type { EventDisconnect } from '../types';
import type { RawBridgeEvent, EventHandler, RawBridgeEventDisconnect } from '../types/internal';
import { BasicHandler } from './BasicHandler';
import { WalletKitError, ERROR_CODES } from '../errors';

export class DisconnectHandler
    extends BasicHandler<EventDisconnect>
    implements EventHandler<EventDisconnect, RawBridgeEventDisconnect>
{
    constructor(
        notify: (event: EventDisconnect) => void,
        private readonly sessionManager: SessionManager,
    ) {
        super(notify);
    }

    canHandle(event: RawBridgeEvent): event is RawBridgeEventDisconnect {
        return event.method === 'disconnect';
    }

    async handle(event: RawBridgeEventDisconnect): Promise<EventDisconnect> {
        if (!event.walletAddress) {
            throw new WalletKitError(
                ERROR_CODES.WALLET_REQUIRED,
                'No wallet address found in disconnect event',
                undefined,
                { eventId: event.id },
            );
        }

        const reason = this.extractDisconnectReason(event);

        const disconnectEvent: EventDisconnect = {
            reason,
            walletAddress: event.walletAddress,
            dAppInfo: event.dAppInfo ?? {},
        };

        await this.sessionManager.removeSession(event.from || '');

        return disconnectEvent;
    }

    /**
     * Extract disconnect reason from bridge event
     */
    private extractDisconnectReason(event: RawBridgeEventDisconnect): string | undefined {
        const params = event.params || {};

        // Check for reason field
        const reason = params.reason;

        if (typeof reason === 'string' && reason.length > 0) {
            return reason.slice(0, 200); // Limit length
        }

        // No specific reason provided
        return undefined;
    }
}
