/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { FC } from 'react';
import { Platform } from 'react-native';

const NonAuthLayout: FC = () => (
    <>
        <Stack
            initialRouteName="add-new-wallet"
            screenOptions={{
                headerShown: false,
                animation: Platform.OS === 'android' ? 'slide_from_right' : 'default',
            }}
        >
            <Stack.Screen name="add-new-wallet" />
            <Stack.Screen name="create-mnemonic" />
            <Stack.Screen name="import-mnemonic" />
            <Stack.Screen name="connect-ledger" />
            <Stack.Screen name="new-password" />
            <Stack.Screen name="unlock-wallet" />
        </Stack>

        <StatusBar style="dark" />
    </>
);

export default NonAuthLayout;
