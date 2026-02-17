/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { GetSelectedWalletReturnType } from '@ton/appkit';
export type UseSelectedWalletReturnType = readonly [GetSelectedWalletReturnType, (walletId: string | null) => void];
/**
 * Hook to get the currently selected wallet
 */
export declare const useSelectedWallet: () => UseSelectedWalletReturnType;
//# sourceMappingURL=use-selected-wallet.d.ts.map