/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AuthState } from '../store/slices/auth/slice';
import type { JettonsState } from '../store/slices/jettons/slice';
import type { NftsState } from '../store/slices/nfts/slice';
import type { TonConnectState } from '../store/slices/ton-connect/slice';
import type { WalletCoreState } from '../store/slices/wallet-core/slice';
import type { WalletManagementState } from '../store/slices/wallet-management/slice';

export interface AppState {
    auth: AuthState;
    jettons: JettonsState;
    nfts: NftsState;
    tonConnect: TonConnectState;
    walletCore: WalletCoreState;
    walletManagement: WalletManagementState;
    isHydrated: boolean;
}

export type SetState = {
    (state: AppState | Partial<AppState>): void;
    (updater: (state: AppState) => void): void;
};
