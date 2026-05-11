/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getSelectedWallet, watchSelectedWallet, setSelectedWalletId } from '@ton/appkit';
import type { GetSelectedWalletReturnType } from '@ton/appkit';

import { useAppKit } from '../../settings';

/**
 * Return type of {@link useSelectedWallet} — `[wallet, setWalletId]` tuple. `wallet` is the active {@link WalletInterface} (or `null`); `setWalletId` calls {@link setSelectedWalletId} and emits `wallets:selection-changed`.
 *
 * @public
 * @category Type
 * @section Wallets
 */
export type UseSelectedWalletReturnType = readonly [GetSelectedWalletReturnType, (walletId: string | null) => void];

/**
 * Read and switch the wallet that AppKit treats as active — most action hooks ({@link useBalance}, {@link useSignText}, {@link useTransferTon}) target this wallet implicitly. Returns a `useState`-style tuple.
 *
 * @returns Tuple `[wallet, setWalletId]`.
 *
 * @public
 * @category Hook
 * @section Wallets
 */
export const useSelectedWallet = (): UseSelectedWalletReturnType => {
    const appKit = useAppKit();

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchSelectedWallet(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        return getSelectedWallet(appKit);
    }, [appKit]);

    const wallet = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const setWalletId = useCallback(
        (walletId: string | null) => {
            setSelectedWalletId(appKit, { walletId });
        },
        [appKit],
    );

    return [wallet, setWalletId] as const;
};
