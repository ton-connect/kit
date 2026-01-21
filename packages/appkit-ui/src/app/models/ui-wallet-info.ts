/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WalletInfo } from '@ton/appkit';

export type UIWalletInfo = WalletInfo & {
    isPreferred?: boolean;
    isSupportRequiredFeatures: boolean;
};
