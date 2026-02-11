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

import { useAppKit } from '../../../hooks/use-app-kit';

export type UseSelectedWalletReturnType = readonly [GetSelectedWalletReturnType, (walletId: string | null) => void];

/**
 * Hook to get the currently selected wallet
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

    const wallet = useSyncExternalStore(subscribe, getSnapshot, () => null);

    const setWalletId = useCallback(
        (walletId: string | null) => {
            setSelectedWalletId(appKit, { walletId });
        },
        [appKit],
    );

    return [wallet, setWalletId] as const;
};
