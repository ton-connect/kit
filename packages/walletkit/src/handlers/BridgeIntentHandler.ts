/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Handles bridge events that carry wire-format intent requests (event has `m`).

import type { ConnectRequest } from '@tonconnect/protocol';

import type {
    EventHandler,
    RawBridgeEvent,
    RawBridgeEventConnect,
    RawBridgeEventGeneric,
    RawBridgeEventIntent,
} from '../types/internal';
import type {
    IntentRequestEvent,
    BatchedIntentEvent,
    ConnectionRequestEvent,
    IntentRequestBase,
    BridgeEvent,
} from '../api/models';
import type { TonWalletKitOptions } from '../types/config';
import { IntentParser } from './IntentParser';
import { ConnectHandler } from './ConnectHandler';
import { BasicHandler } from './BasicHandler';
import type { AnalyticsManager } from '../analytics';

export class BridgeIntentHandler
    extends BasicHandler<(IntentRequestEvent & BridgeEvent) | BatchedIntentEvent>
    implements EventHandler<(IntentRequestEvent & BridgeEvent) | BatchedIntentEvent, RawBridgeEventIntent>
{
    private parser = new IntentParser();
    private connectHandler: ConnectHandler;

    constructor(
        notify: (event: (IntentRequestEvent & BridgeEvent) | BatchedIntentEvent) => void,
        private readonly config: TonWalletKitOptions,
        analyticsManager?: AnalyticsManager,
    ) {
        super(notify);
        this.connectHandler = new ConnectHandler(() => {}, config, analyticsManager);
    }

    canHandle(event: RawBridgeEvent): event is RawBridgeEventIntent {
        return event.method === 'connect' && 'm' in event.params;
    }

    async handle(event: RawBridgeEventIntent): Promise<(IntentRequestEvent & BridgeEvent) | BatchedIntentEvent> {
        const origin = event.isJsBridge ? ('jsBridge' as const) : ('bridge' as const);
        const { event: intentEvent, connectRequest } = this.parser.fromWireRequest(event.params, {
            clientId: event.from ?? '',
            origin,
            traceId: event.traceId,
        });
        const base = (intentEvent as Exclude<IntentRequestEvent, { type: 'connect' }>).value as IntentRequestBase;
        if (!connectRequest) {
            return {
                ...event,
                isJsBridge: true,
                id: base.id,
                origin: base.origin,
                clientId: base.clientId,
                traceId: base.traceId,
                returnStrategy: base.returnStrategy,
                ...intentEvent,
            };
        }

        const connectionEvent = await this.resolveConnectRequest(connectRequest, event);
        const connectItem: IntentRequestEvent = { type: 'connect', value: connectionEvent };
        // When connectRequest is present, intentEvent is never 'connect', so value has IntentRequestBase
        const final = {
            ...event,
            isJsBridge: true,
            id: base.id,
            origin: base.origin,
            clientId: base.clientId,
            traceId: base.traceId,
            returnStrategy: base.returnStrategy,
            ...intentEvent,
            //intents: [/*connectItem*/ intentEvent],
        };
        console.log('INTENT', final);
        return final;
    }

    private async resolveConnectRequest(
        connectRequest: ConnectRequest,
        wire: RawBridgeEventIntent,
    ): Promise<ConnectionRequestEvent> {
        const bridgeEvent: RawBridgeEventConnect = {
            ...wire,
            from: wire.from ?? '',
            id: wire.id,
            method: 'connect',
            params: {
                manifest: { url: connectRequest.manifestUrl },
                items: connectRequest.items,
            },
            timestamp: Date.now(),
            domain: '',
        };
        return this.connectHandler.handle(bridgeEvent);
    }
}
