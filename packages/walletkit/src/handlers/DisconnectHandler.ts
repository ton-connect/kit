// Disconnect event handler

import type { EventDisconnect } from '../types';
import type { RawBridgeEvent, EventHandler, RawBridgeEventDisconnect } from '../types/internal';
import { BasicHandler } from './BasicHandler';

export class DisconnectHandler
    extends BasicHandler<EventDisconnect>
    implements EventHandler<EventDisconnect, RawBridgeEventDisconnect>
{
    canHandle(event: RawBridgeEvent): event is RawBridgeEventDisconnect {
        return event.method === 'disconnect';
    }

    async handle(event: RawBridgeEventDisconnect): Promise<EventDisconnect> {
        if (!event.wallet) {
            throw new Error('No wallet found in event');
        }

        const reason = this.extractDisconnectReason(event);

        const disconnectEvent: EventDisconnect = {
            reason,
            wallet: event.wallet,
        };

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
