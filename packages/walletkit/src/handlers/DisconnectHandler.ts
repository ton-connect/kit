/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Disconnect event handler

import type { TONConnectSessionManager } from '../api/interfaces/TONConnectSessionManager';
import type { RawBridgeEvent, EventHandler, RawBridgeEventDisconnect } from '../types/internal';
import { BasicHandler } from './BasicHandler';
import { WalletKitError, ERROR_CODES } from '../errors';
import type { DisconnectionEvent } from '../api/models';

export class DisconnectHandler
    extends BasicHandler<DisconnectionEvent>
    implements EventHandler<DisconnectionEvent, RawBridgeEventDisconnect>
{
    constructor(
        notify: (event: DisconnectionEvent) => void,
        private readonly sessionManager: TONConnectSessionManager,
    ) {
        super(notify);
    }

    canHandle(event: RawBridgeEvent): event is RawBridgeEventDisconnect {
        return event.method === 'disconnect';
    }

    async handle(event: RawBridgeEventDisconnect): Promise<DisconnectionEvent> {
        // Support both walletId (new) and walletAddress (legacy)
        const walletId = event.walletId;
        const walletAddress = event.walletAddress;

        if (!walletId && !walletAddress) {
            throw new WalletKitError(ERROR_CODES.WALLET_REQUIRED, 'No wallet ID found in disconnect event', undefined, {
                eventId: event.id,
            });
        }

        const reason = this.extractDisconnectReason(event);

        const disconnectEvent: DisconnectionEvent = {
            id: event.id,
            preview: {
                reason,
                dAppInfo: event.dAppInfo ?? {},
            },
            walletId: walletId ?? '',
            walletAddress: walletAddress,
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
