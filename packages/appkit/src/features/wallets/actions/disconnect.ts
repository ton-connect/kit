/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../../core/app-kit';

export type DisconnectParameters = {
    connectorId: string;
};

export type DisconnectReturnType = void;

/**
 * Disconnect wallet using specific connector
 */
export async function disconnect(appKit: AppKit, parameters: DisconnectParameters): Promise<DisconnectReturnType> {
    const { connectorId } = parameters;
    const connector = appKit.connectors.get(connectorId);

    if (!connector) {
        throw new Error(`Connector with id "${connectorId}" not found`);
    }

    await connector.disconnectWallet();
}
