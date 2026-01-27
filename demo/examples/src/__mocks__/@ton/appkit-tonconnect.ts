/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { vi } from 'vitest';

export class TonConnectConnector {
    readonly id: string;
    readonly type = 'tonconnect/sdk';

    constructor(
        public config: {
            id?: string;
        } = {},
    ) {
        this.id = config.id ?? 'tonconnect-default';
    }

    initialize = vi.fn();
    destroy = vi.fn();
    connectWallet = vi.fn();
    disconnectWallet = vi.fn();
    getConnectedWallets = vi.fn(() => []);
}

export const TonConnectWalletAdapter = vi.fn();

export const mockedTonConnectConnector = TonConnectConnector;
