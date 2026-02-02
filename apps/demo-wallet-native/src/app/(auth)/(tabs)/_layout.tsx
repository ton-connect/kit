/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { FC, ReactNode } from 'react';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

type IconRenderer = (args: { focused: boolean; color: string; size: number }) => ReactNode;

const renderWalletIcon: IconRenderer = ({ color, size }) => <Ionicons color={color} name="wallet" size={size} />;
const renderNftIcon: IconRenderer = ({ color, size }) => <Ionicons color={color} name="images" size={size} />;
const renderHistoryIcon: IconRenderer = ({ color, size }) => <Ionicons color={color} name="time" size={size} />;
const renderSettingsIcon: IconRenderer = ({ color, size }) => <Ionicons color={color} name="settings" size={size} />;

const TabsStack: FC = () => {
    const { theme } = useUnistyles();

    return (
        <Tabs
            detachInactiveScreens
            initialRouteName="wallet"
            screenOptions={{
                tabBarActiveTintColor: theme.colors.tabBar.active,
                tabBarInactiveTintColor: theme.colors.tabBar.inactive,
                tabBarStyle: styles.tabBar,
                tabBarItemStyle: styles.item,
                headerShown: false,
            }}
        >
            <Tabs.Screen name="wallet" options={{ tabBarIcon: renderWalletIcon, tabBarLabel: 'Wallet' }} />
            <Tabs.Screen name="nft" options={{ tabBarIcon: renderNftIcon, tabBarLabel: 'NFTs' }} />
            <Tabs.Screen name="history" options={{ tabBarIcon: renderHistoryIcon, tabBarLabel: 'History' }} />
            <Tabs.Screen name="settings" options={{ tabBarIcon: renderSettingsIcon, tabBarLabel: 'Settings' }} />
        </Tabs>
    );
};

export default TabsStack;

const styles = StyleSheet.create(({ colors }) => ({
    tabBar: {
        backgroundColor: colors.tabBar.background,
        borderWidth: 0,
        borderTopColor: colors.tabBar.borderColor,
    },
    item: {
        borderWidth: 0,
    },
}));
