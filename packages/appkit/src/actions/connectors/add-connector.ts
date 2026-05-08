/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { ConnectorInput } from '../../types/connector';

/**
 * Connector instance or factory accepted by {@link addConnector} — same shape used in {@link AppKitConfig}`.connectors`.
 *
 * @public
 * @category Type
 * @section Connectors
 */
export type AddConnectorParameters = ConnectorInput;

/**
 * Return type of {@link addConnector} — call to remove the connector from AppKit.
 *
 * @public
 * @category Type
 * @section Connectors
 */
export type AddConnectorReturnType = () => void;

/**
 * Register a wallet connector at runtime — equivalent to passing it via {@link AppKitConfig}`.connectors` at construction, but available after AppKit is up.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param connectorFn - {@link AddConnectorParameters} Connector instance or factory to register.
 * @returns Function that unregisters the connector when called.
 *
 * @sample docs/examples/src/appkit/actions/connectors#ADD_CONNECTOR
 *
 * @public
 * @category Action
 * @section Connectors
 */
export const addConnector = (appKit: AppKit, connectorFn: AddConnectorParameters): AddConnectorReturnType => {
    return appKit.addConnector(connectorFn);
};
