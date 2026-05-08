/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Connector } from '../../types/connector';
import type { AppKit } from '../../core/app-kit';

/**
 * Options for {@link getConnectorById}.
 *
 * @public
 * @category Type
 * @section Connectors and wallets
 */
export interface GetConnectorByIdOptions {
    /** Id of the connector to look up. */
    id: string;
}

/**
 * Return type of {@link getConnectorById} — `undefined` when no connector with that id is registered.
 *
 * @public
 * @category Type
 * @section Connectors and wallets
 */
export type GetConnectorByIdReturnType = Connector | undefined;

/**
 * Look up a registered connector by its id.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetConnectorByIdOptions} Id of the connector to find.
 * @returns The matching {@link Connector}, or `undefined` if none with that id is registered.
 *
 * @sample docs/examples/src/appkit/actions/connectors#GET_CONNECTOR_BY_ID
 * @expand options
 *
 * @public
 * @category Action
 * @section Connectors and wallets
 */
export const getConnectorById = (appKit: AppKit, options: GetConnectorByIdOptions): GetConnectorByIdReturnType => {
    return appKit.connectors.find((connector) => connector.id === options.id);
};
