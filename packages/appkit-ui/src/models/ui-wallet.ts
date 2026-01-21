/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WalletInfoInjectable, WalletInfoRemote } from '@ton/appkit';

export type UIWallet = Omit<WalletInfoInjectable, 'injected' | 'embedded'> | WalletInfoRemote;
