// Disconnect event handler

import { SessionManager } from '../core/SessionManager';
import type { EventDisconnect } from '../types';
import type { RawBridgeEvent, EventHandler, RawBridgeEventDisconnect } from '../types/internal';
import { BasicHandler } from './BasicHandler';

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
            throw new Error('No wallet found in event');
        }

        const reason = this.extractDisconnectReason(event);

        const disconnectEvent: EventDisconnect = {
            reason,
            walletAddress: event.walletAddress,
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
