/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot } from 'expo-router';
import type { FC } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useUnistyles } from 'react-native-unistyles';
import { Platform } from 'react-native';
import { WalletProvider } from '@demo/wallet-core';
import type { WalletKitConfig } from '@demo/wallet-core';

import { AppWrapper, walletProviderStorage, walletKitStorage, getCurrentUserId } from '@/features/settings';
import { AppToastProvider } from '@/features/toasts';
import { createBLELedgerTransportFactory, ledgerDeviceStorage } from '@/features/ledger';
import { envConfig } from '@/core/configs/env';

import '@/core/libs/unistyles';
import 'react-native-reanimated';

const { tonApi, bridge } = envConfig;

/**
 * Creates a BLE transport for Ledger hardware wallets.
 * Uses the stored device ID to reconnect to a previously paired device.
 */
const createLedgerTransport = createBLELedgerTransportFactory(ledgerDeviceStorage);

const walletKitConfig: WalletKitConfig = {
    storage: walletKitStorage,
    bridgeUrl: bridge.url,
    tonApiKeyMainnet: tonApi.mainnetApiKey,
    tonApiKeyTestnet: tonApi.testnetApiKey,
    createLedgerTransport,
    analytics: {
        appInfo: {
            env: 'web',
            platform: Platform.OS === 'ios' ? 'ios' : 'android',
            getLocale: () => 'en-US',
            getCurrentUserId,
        },
    },
};

const RootLayout: FC = () => {
    const { theme } = useUnistyles();

    return (
        <GestureHandlerRootView>
            <KeyboardProvider>
                <BottomSheetModalProvider>
                    <ThemeProvider
                        value={{
                            ...DefaultTheme,
                            colors: {
                                ...DefaultTheme.colors,
                                background: theme.colors.background.main,
                            },
                        }}
                    >
                        <WalletProvider storage={walletProviderStorage} walletKitConfig={walletKitConfig}>
                            <AppWrapper>
                                <Slot />
                                <AppToastProvider />
                            </AppWrapper>
                        </WalletProvider>
                    </ThemeProvider>
                </BottomSheetModalProvider>
            </KeyboardProvider>
        </GestureHandlerRootView>
    );
};

export default RootLayout;
