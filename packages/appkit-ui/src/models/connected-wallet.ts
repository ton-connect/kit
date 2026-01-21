/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Wallet, WalletInfoBase, WalletInfoInjectable, WalletInfoRemote } from '@ton/appkit';

export type WalletOpenMethod = 'qrcode' | 'universal-link' | 'custom-deeplink';

export type WalletInfoWithOpenMethod =
    | WalletInfoInjectable
    | WalletInfoRemoteWithOpenMethod
    | WalletInfoWalletConnect
    | (WalletInfoInjectable & WalletInfoRemoteWithOpenMethod);

export type WalletInfoRemoteWithOpenMethod = WalletInfoRemote & {
    openMethod?: WalletOpenMethod;
};

export type WalletInfoWalletConnect = WalletInfoBase & {
    type: 'wallet-connect';
};

export type ConnectedWallet = Wallet & WalletInfoWithOpenMethod;
