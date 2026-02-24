/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { setSelectedWalletId } from '@ton/appkit';

export const setSelectedWalletIdExample = (appKit: AppKit) => {
    // SAMPLE_START: SET_SELECTED_WALLET_ID
    setSelectedWalletId(appKit, {
        walletId: 'my-wallet-id',
    });
    // SAMPLE_END: SET_SELECTED_WALLET_ID
};
