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
 * @section Connectors and wallets
 */
export type WatchConnectorsParameters = {
    /** Callback fired after each wallet-connection event with the current list of registered connectors. */
    onChange: (connectors: readonly Connector[]) => void;
};

/**
 * Return type of {@link watchConnectors} — call to stop receiving updates.
 *
 * @public
 * @category Type
 * @section Connectors and wallets
 */
export type WatchConnectorsReturnType = () => void;

/**
 * Subscribe to the list of registered connectors; the callback fires after every wallet-connection event so the caller can re-read state derived from connectors (e.g., connected wallets).
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
 * @section Connectors and wallets
 */
export const watchConnectors = (appKit: AppKit, parameters: WatchConnectorsParameters): WatchConnectorsReturnType => {
    const { onChange } = parameters;

    const unsubscribe = appKit.emitter.on(CONNECTOR_EVENTS.CONNECTED, () => {
        onChange(getConnectors(appKit));
    });

    return unsubscribe;
};
