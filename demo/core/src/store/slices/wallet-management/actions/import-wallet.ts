/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createWallet } from './create-wallet';

export const importWallet = async (
    mnemonic: string[],
    name?: string,
    version?: 'v5r1' | 'v4r2',
    network?: 'mainnet' | 'testnet',
) => {
    return createWallet(mnemonic, name, version, network);
};
