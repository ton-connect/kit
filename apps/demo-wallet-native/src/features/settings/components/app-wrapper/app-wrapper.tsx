/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { hideAsync, preventAutoHideAsync } from 'expo-splash-screen';
import { type FC, type PropsWithChildren, useEffect } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useWalletStore } from '@ton/demo-core';
import { useInitialRedirect } from 'src/features/settings/hooks/use-initial-redirect';

import { useAppFonts } from '../../hooks/use-app-fonts';
import { useTheme } from '../../hooks/use-theme';
import { useWalletDataUpdater } from '../../hooks/use-wallet-data-updater';
import { setIsAppReady } from '../../store/actions/is-app-ready';

import { LoaderCircle } from '@/core/components/loader-circle';
import { TonConnectHandler } from '@/features/ton-connect';

// Prevent the splash screen from auto-hiding before asset loading is complete.
void preventAutoHideAsync();

export const AppWrapper: FC<PropsWithChildren> = ({ children }) => {
    const isStoreHydrated = useWalletStore((state) => state.isHydrated);

    const { isFontsError, isFontsLoaded } = useAppFonts();
    const isStatusBarReady = useTheme();

    const isLoaderShown = !(isFontsLoaded || isFontsError) || !isStoreHydrated;

    useInitialRedirect(isLoaderShown);
    useWalletDataUpdater();

    useEffect(() => {
        // eslint-disable-next-line no-undef
        let timeout: NodeJS.Timeout;

        if ((isFontsLoaded || isFontsError) && isStatusBarReady) {
            timeout = setTimeout(() => {
                void hideAsync();
            }, 50);
        }

        return (): void => clearTimeout(timeout);
    }, [isFontsLoaded, isFontsError, isStatusBarReady]);

    useEffect(() => {
        if (!isLoaderShown) setIsAppReady(true);
    }, [isLoaderShown]);

    return (
        <View style={[styles.container, isLoaderShown && styles.loaderContainer]}>
            {isLoaderShown && <LoaderCircle size={54} />}
            {!isLoaderShown && (
                <>
                    {children}

                    <TonConnectHandler />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        flex: 1,
        backgroundColor: colors.background.main,
    },
    loaderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: sizes.page.paddingHorizontal,
    },
}));
