/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { getDefaultNetwork } from '../network/get-default-network';

/**
 * Parameters accepted by {@link connect}.
 *
 * @public
 * @category Type
 * @section Connectors
 */
export type ConnectParameters = {
    /** Id of the registered connector to drive the connection through (e.g., `'tonconnect'`). */
    connectorId: string;
};

/**
 * Return type of {@link connect}.
 *
 * @public
 * @category Type
 * @section Connectors
 */
export type ConnectReturnType = void;

/**
 * Trigger the connection flow on a registered connector by id; throws when no connector with that id exists.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link ConnectParameters} Connector to connect through.
 * @returns Resolves once the connector's connect flow completes (e.g., the TonConnect modal closes); if a wallet was successfully connected, it becomes available via {@link getSelectedWallet}.
 *
 * @sample docs/examples/src/appkit/actions/connectors#CONNECT
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Connectors
 */
export const connect = async (appKit: AppKit, parameters: ConnectParameters): Promise<ConnectReturnType> => {
    const { connectorId } = parameters;
    const connector = appKit.connectors.find((c) => c.id === connectorId);

    if (!connector) {
        throw new Error(`Connector with id "${connectorId}" not found`);
    }

    const network = getDefaultNetwork(appKit);
    await connector.connectWallet(network);
};
