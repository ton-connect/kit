/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { router, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useWalletStore, useWallet } from '@demo/core';

export const useRedirects = (isRouterLoading: boolean): void => {
    const [isRedirected, setIsRedirected] = useState(false);

    const isStoreHydrated = useWalletStore((state) => state.isHydrated);
    const isPasswordSet = useWalletStore((state) => state.auth.isPasswordSet);
    const isUnlocked = useWalletStore((state) => state.auth.isUnlocked);
    const { hasWallet } = useWallet();
    const segments = useSegments();

    const isReady = !isRouterLoading && isStoreHydrated;

    // Initial redirect when the app becomes ready
    useEffect(() => {
        if (!isReady || isRedirected) return;

        setIsRedirected(true);

        if (!isPasswordSet) {
            router.replace('/(non-auth)/add-new-wallet');

            return;
        }

        if (!isUnlocked) {
            router.replace('/(non-auth)/unlock-wallet');

            return;
        }

        if (!hasWallet) {
            router.replace('/(non-auth)/add-new-wallet');

            return;
        }

        router.replace('/(auth)/(tabs)/wallet');
    }, [isReady, isRedirected, isPasswordSet, isUnlocked, hasWallet]);

    // If the user is already unlocked but has no wallet, do not allow staying in the auth group.
    // Redirect to the wallet creation flow.
    useEffect(() => {
        if (isUnlocked && isStoreHydrated) {
            const inAuthGroup = segments[0] === '(auth)';

            if (!hasWallet && inAuthGroup) {
                router.replace('/(non-auth)/add-new-wallet');
            }
        }
    }, [isUnlocked, isStoreHydrated, segments, hasWallet]);
};
