/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WalletKitConfig } from '../../types';

let walletKitConfig: WalletKitConfig | undefined;

export const setWalletKitConfig = (config?: WalletKitConfig) => {
    walletKitConfig = config;
};

export const getWalletKitConfig = (): WalletKitConfig | undefined => {
    return walletKitConfig;
};
