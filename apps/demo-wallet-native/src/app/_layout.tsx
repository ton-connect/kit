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

const ENV_TON_API_KEY_MAINNET = '25a9b2326a34b39a5fa4b264fb78fb4709e1bd576fc5e6b176639f5b71e94b0d';
const ENV_TON_API_KEY_TESTNET = 'd852b54d062f631565761042cccea87fa6337c41eb19b075e6c7fb88898a3992';
const LEDGER_DEVICE_ID_KEY = 'ledger_device_id';

import '@/core/libs/unistyles';
import 'react-native-reanimated';

/**
 * Storage adapter for Ledger device ID using AsyncStorage.
 * This persists the last connected Ledger device ID for reconnection.
 */
const ledgerDeviceStorage: LedgerDeviceStorage = {
    getDeviceId: () => AsyncStorage.getItem(LEDGER_DEVICE_ID_KEY),
    setDeviceId: (deviceId: string) => AsyncStorage.setItem(LEDGER_DEVICE_ID_KEY, deviceId),
    clearDeviceId: () => AsyncStorage.removeItem(LEDGER_DEVICE_ID_KEY),
};

/**
 * Creates a BLE transport for Ledger hardware wallets.
 * Uses the stored device ID to reconnect to a previously paired device.
 */
const createLedgerTransport = createBLELedgerTransportFactory(ledgerDeviceStorage);

const walletKitConfig: WalletKitConfig = {
    storage: walletKitStorage,
    bridgeUrl: 'https://walletbot.me/tonconnect-bridge/bridge',
    tonApiKeyMainnet: ENV_TON_API_KEY_MAINNET,
    tonApiKeyTestnet: ENV_TON_API_KEY_TESTNET,
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
