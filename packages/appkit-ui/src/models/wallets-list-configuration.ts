/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UIWallet } from './ui-wallet';

/**
 * Add corrections to the default wallets list in the modal: add custom wallets and change wallets order.
 */
export type WalletsListConfiguration = {
    /**
     * Allows to include extra wallets to the wallets list in the modal.
     */
    includeWallets?: UIWallet[];
};
