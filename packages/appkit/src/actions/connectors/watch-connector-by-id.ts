/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { CONNECTOR_EVENTS } from '../../core/app-kit';
import type { Connector } from '../../types/connector';
import { getConnectorById } from './get-connector-by-id';

/**
 * Parameters accepted by {@link watchConnectorById}.
 *
 * @public
 * @category Type
 * @section Connectors
 */
export interface WatchConnectorByIdParameters {
    /** ID of the connector to watch. */
    id: string;
    /** Callback invoked when the connector with the watched id is registered or unregistered — receives the connector itself, or `undefined` when none is registered under that id. */
    onChange: (connector: Connector | undefined) => void;
}

/**
 * Return type of {@link watchConnectorById} — call to stop receiving updates.
 *
 * @public
 * @category Type
 * @section Connectors
 */
export type WatchConnectorByIdReturnType = () => void;

/**
 * Subscribe to register/unregister events for a connector with the given id — the callback fires when the connector is added or removed, so callers can react to its presence. Use {@link watchConnectedWallets} if you want to react to wallet connect/disconnect events instead.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link WatchConnectorByIdParameters} Connector ID and update callback.
 * @returns Unsubscribe function — call it to stop receiving updates.
 *
 * @sample docs/examples/src/appkit/actions/connectors#WATCH_CONNECTOR_BY_ID
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Connectors
 */
export const watchConnectorById = (
    appKit: AppKit,
    parameters: WatchConnectorByIdParameters,
): WatchConnectorByIdReturnType => {
    const { id, onChange } = parameters;

    const handler = (): void => {
        onChange(getConnectorById(appKit, { id }));
    };

    const unsubscribeAdded = appKit.emitter.on(CONNECTOR_EVENTS.ADDED, handler);
    const unsubscribeRemoved = appKit.emitter.on(CONNECTOR_EVENTS.REMOVED, handler);

    return () => {
        unsubscribeAdded();
        unsubscribeRemoved();
    };
};
