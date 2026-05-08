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
    /** Id of the connector to watch. */
    id: string;
    /** Callback fired after each wallet-connection event with the current connector (or `undefined` when none is registered under this id). */
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
 * Subscribe to a connector by id; the callback fires after every wallet-connection event so the caller can re-read connector state (e.g., {@link Connector}`.getConnectedWallets()`).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link WatchConnectorByIdParameters} Connector id and update callback.
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

    const unsubscribe = appKit.emitter.on(CONNECTOR_EVENTS.CONNECTED, () => {
        onChange(getConnectorById(appKit, { id }));
    });

    return unsubscribe;
};
