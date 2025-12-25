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
import { WalletProvider } from '@ton/demo-core';
import type { WalletKitConfig } from '@ton/demo-core';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppWrapper } from '@/features/settings';
import { AppToastProvider } from '@/features/toasts';
import { walletProviderStorage } from '@/features/settings/storage/wallet-provider';
import { walletKitStorage } from '@/features/settings/storage/wallet-kit';
import { createBLELedgerTransportFactory } from '@/features/ledger';
import type { LedgerDeviceStorage } from '@/features/ledger';
import { envConfig } from '@/core/configs/env';

import '@/core/libs/unistyles';
import 'react-native-reanimated';

/**
 * Storage adapter for Ledger device ID using AsyncStorage.
 * This persists the last connected Ledger device ID for reconnection.
 */
const { ledger, tonApi, bridge } = envConfig;

const ledgerDeviceStorage: LedgerDeviceStorage = {
    getDeviceId: () => AsyncStorage.getItem(ledger.deviceIdKey),
    setDeviceId: (deviceId: string) => AsyncStorage.setItem(ledger.deviceIdKey, deviceId),
    clearDeviceId: () => AsyncStorage.removeItem(ledger.deviceIdKey),
};

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
