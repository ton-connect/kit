/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';

/**
 * Parameters accepted by {@link disconnect}.
 *
 * @public
 * @category Type
 * @section Connectors
 */
export type DisconnectParameters = {
    /** ID of the registered connector whose wallet should be disconnected. */
    connectorId: string;
};

/**
 * Return type of {@link disconnect}.
 *
 * @public
 * @category Type
 * @section Connectors
 */
export type DisconnectReturnType = void;

/**
 * Disconnect the wallet currently connected through a registered connector; throws when no connector with that id exists.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link DisconnectParameters} Connector to disconnect.
 * @returns Resolves once the connector tears down its session.
 *
 * @sample docs/examples/src/appkit/actions/connectors#DISCONNECT
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Connectors
 */
export const disconnect = async (appKit: AppKit, parameters: DisconnectParameters): Promise<DisconnectReturnType> => {
    const { connectorId } = parameters;
    const connector = appKit.connectors.find((c) => c.id === connectorId);

    if (!connector) {
        throw new Error(`Connector with id "${connectorId}" not found`);
    }

    await connector.disconnectWallet();
};
