/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { router, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useWalletStore, useWallet } from '@ton/demo-core';

export const useInitialRedirect = (isRouterLoading: boolean): void => {
    const [isRedirected, setIsRedirected] = useState(false);

    const isStoreHydrated = useWalletStore((state) => state.isHydrated);
    const isPasswordSet = useWalletStore((state) => state.auth.isPasswordSet);
    const isUnlocked = useWalletStore((state) => state.auth.isUnlocked);
    const { hasWallet } = useWallet();

    const segments = useSegments();

    const isInAuthGroup = segments[0] === '(non-auth)';
    const isReady = !isRouterLoading && isStoreHydrated;

    useEffect(() => {
        if (!isReady || isRedirected) return;

        setIsRedirected(true);

        console.log(`isPasswordSet: ${isPasswordSet}, isUnlocked: ${isUnlocked}, hasWallet: ${hasWallet}`);

        if (!isPasswordSet) {
            router.replace('/(non-auth)/start');

            return;
        }

        if (!isUnlocked) {
            router.replace('/(non-auth)/unlock-wallet');

            return;
        }

        if (!hasWallet) {
            router.replace('/(non-auth)/start');

            return;
        }

        router.replace('/(auth)/(tabs)/wallet');
    }, [isReady, isRedirected, isPasswordSet, isUnlocked, hasWallet]);
};
