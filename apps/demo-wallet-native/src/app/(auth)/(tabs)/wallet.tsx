/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import { openURL } from 'expo-linking';
import { router } from 'expo-router';
import { type FC, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useWallet } from '@ton/demo-core';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppButton } from '@/core/components/app-button';
import { ScreenHeader } from '@/core/components/screen-header';
import { ScreenWrapper } from '@/core/components/screen-wrapper';
import { noop } from '@/core/utils/noop';
import { getBalance, JettonList, TonBalanceCard } from '@/features/balances';
import { WalletSwitcher } from '@/features/wallets';

const WalletHomeScreen: FC = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { address, savedWallets, activeWalletId, switchWallet, removeWallet, renameWallet, updateBalance } =
        useWallet();

    const { theme } = useUnistyles();

    const handleOpenExplorer = () => {
        if (address) {
            void openURL(`https://tonviewer.com/${address}`);
        }
    };

    const handleSend = () => {
        router.push('/send');
    };

    const handleReceive = () => {
        router.push('/receive');
    };

    const refreshBalance = async () => {
        setIsRefreshing(true);
        await updateBalance().catch(noop);
        await getBalance().catch(noop);
        setIsRefreshing(false);
    };

    const handleSwitchWallet = async (walletId: string) => {
        try {
            await switchWallet(walletId);
        } catch (err) {
            console.error('Failed to switch wallet:', err);
        }
    };

    const handleRemoveWallet = (walletId: string) => {
        try {
            removeWallet(walletId);
        } catch (err) {
            console.error('Failed to remove wallet:', err);
        }
    };

    const handleRenameWallet = (walletId: string, newName: string) => {
        try {
            renameWallet(walletId, newName);
        } catch (err) {
            console.error('Failed to rename wallet:', err);
        }
    };

    return (
        <ScreenWrapper refreshControl={<RefreshControl onRefresh={refreshBalance} refreshing={isRefreshing} />}>
            <ScreenHeader.Container style={styles.header}>
                <ScreenHeader.Title style={styles.title}>Wallet</ScreenHeader.Title>

                <ScreenHeader.RightSide>
                    <ActiveTouchAction onPress={handleOpenExplorer}>
                        <Ionicons color={theme.colors.text.secondary} name="open-outline" size={20} />
                    </ActiveTouchAction>
                </ScreenHeader.RightSide>
            </ScreenHeader.Container>

            {/* Wallet Switcher */}
            <WalletSwitcher
                activeWalletId={activeWalletId}
                onRemoveWallet={handleRemoveWallet}
                onRenameWallet={handleRenameWallet}
                onSwitchWallet={handleSwitchWallet}
                savedWallets={savedWallets}
            />

            <TonBalanceCard style={styles.tonBalance} />

            <View style={styles.actions}>
                <AppButton.Container onPress={handleSend} style={styles.sendButton}>
                    <Ionicons color={theme.colors.buttonPrimary.color} name="paper-plane-outline" size={20} />
                    <AppButton.Text>Send</AppButton.Text>
                </AppButton.Container>

                <AppButton.Container colorScheme="secondary" onPress={handleReceive} style={styles.sendButton}>
                    <Ionicons color={theme.colors.buttonSecondary.color} name="download-outline" size={20} />
                    <AppButton.Text>Receive</AppButton.Text>
                </AppButton.Container>
            </View>

            <JettonList />
        </ScreenWrapper>
    );
};

export default WalletHomeScreen;

const styles = StyleSheet.create(({ sizes }) => ({
    header: {
        justifyContent: 'flex-start',
    },
    title: {
        textAlign: 'left',
    },
    tonBalance: {
        marginBottom: sizes.space.vertical * 2,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: sizes.space.vertical * 3,
        gap: sizes.space.horizontal / 2,
    },
    sendButton: {
        flex: 1,
        maxWidth: 150,
        gap: sizes.space.horizontal / 2,
        marginHorizontal: 0,
    },
}));
