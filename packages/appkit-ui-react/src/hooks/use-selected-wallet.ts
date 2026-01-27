/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { watchSelectedWallet, getSelectedWallet, setSelectedWalletId as setSelectedWalletIdAction } from '@ton/appkit';

import { useAppKit } from './use-app-kit';

export const useSelectedWallet = () => {
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

    const selectedWallet = useSyncExternalStore(subscribe, getSnapshot, () => null);

    const setSelectedWalletId = useCallback(
        (walletId: string | null) => {
            setSelectedWalletIdAction(appKit, { walletId });
        },
        [appKit],
    );

    return [selectedWallet, setSelectedWalletId] as const;
};
