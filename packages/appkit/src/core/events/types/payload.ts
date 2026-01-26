/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WalletInterface } from '../../../features/wallets';

export interface WalletConnectedPayload {
    wallets: WalletInterface[];
    connectorId: string;
}

export interface WalletDisconnectedPayload {
    connectorId: string;
}

export interface PluginRegisteredPayload {
    pluginId: string;
    pluginType: string;
}
