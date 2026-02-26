/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { getDefaultNetwork } from '../network/get-default-network';

export type ConnectParameters = {
    connectorId: string;
};

export type ConnectReturnType = void;

/**
 * Connect wallet using specific connector
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
