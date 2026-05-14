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
import { getConnectors } from './get-connectors';

/**
 * Parameters accepted by {@link watchConnectors}.
 *
 * @public
 * @category Type
 * @section Connectors
 */
export type WatchConnectorsParameters = {
    /** Callback invoked when the list of registered connectors changes — receives the current list. */
    onChange: (connectors: readonly Connector[]) => void;
};

/**
 * Return type of {@link watchConnectors} — call to stop receiving updates.
 *
 * @public
 * @category Type
 * @section Connectors
 */
export type WatchConnectorsReturnType = () => void;

/**
 * Subscribe to changes in the registered-connectors list — the callback fires when a connector is added (via {@link addConnector} or AppKit's constructor) or removed, and receives the current list. Use {@link watchConnectedWallets} if you want to react to wallet connect/disconnect events instead.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link WatchConnectorsParameters} Update callback.
 * @returns Unsubscribe function — call it to stop receiving updates.
 *
 * @sample docs/examples/src/appkit/actions/connectors#WATCH_CONNECTORS
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Connectors
 */
export const watchConnectors = (appKit: AppKit, parameters: WatchConnectorsParameters): WatchConnectorsReturnType => {
    const { onChange } = parameters;

    const handler = (): void => {
        onChange(getConnectors(appKit));
    };

    const unsubscribeAdded = appKit.emitter.on(CONNECTOR_EVENTS.ADDED, handler);
    const unsubscribeRemoved = appKit.emitter.on(CONNECTOR_EVENTS.REMOVED, handler);

    return () => {
        unsubscribeAdded();
        unsubscribeRemoved();
    };
};
