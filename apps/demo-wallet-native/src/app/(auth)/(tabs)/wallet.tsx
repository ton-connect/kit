/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons, AntDesign } from '@expo/vector-icons';
import { openURL } from 'expo-linking';
import { router } from 'expo-router';
import { useState } from 'react';
import type { FC } from 'react';
import { RefreshControl, View, Image } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useJettons, useWallet } from '@demo/core';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppButton } from '@/core/components/app-button';
import { ScreenHeader } from '@/core/components/screen-header';
import { ScreenWrapper } from '@/core/components/screen-wrapper';
import { noop } from '@/core/utils/noop';
import { JettonList, TonBalanceCard } from '@/features/balances';
import { WalletSwitcher } from '@/features/wallets';

const WalletHomeScreen: FC = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isWalletSwitcherOpen, setIsWalletSwitcherOpen] = useState(false);

    const { address, savedWallets, activeWalletId, switchWallet, removeWallet, renameWallet, updateBalance } =
        useWallet();
    const { loadUserJettons } = useJettons();

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
        await loadUserJettons().catch(noop);
        setIsRefreshing(false);
    };

    const handleSwitchWallet = async (walletId: string) => {
        try {
            await switchWallet(walletId);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to switch wallet:', err);
        }
    };

    const handleRemoveWallet = (walletId: string) => {
        try {
            removeWallet(walletId);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to remove wallet:', err);
        }
    };

    const handleRenameWallet = (walletId: string, newName: string) => {
        try {
            renameWallet(walletId, newName);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to rename wallet:', err);
        }
    };

    const activeWallet = savedWallets.find((w) => w.id === activeWalletId);
    const walletName = activeWallet?.name || 'Wallet';

    return (
        <ScreenWrapper refreshControl={<RefreshControl onRefresh={refreshBalance} refreshing={isRefreshing} />}>
            <ScreenHeader.Container style={styles.header}>
                <ActiveTouchAction onPress={() => setIsWalletSwitcherOpen(true)} style={styles.titleContainer}>
                    <ScreenHeader.Title style={styles.title}>{walletName}</ScreenHeader.Title>
                    <Ionicons
                        color={theme.colors.text.highlight}
                        name="chevron-down"
                        size={16}
                        style={styles.chevron}
                    />
                </ActiveTouchAction>

                <ScreenHeader.RightSide>
                    <ActiveTouchAction onPress={() => router.push('/connect-dapp')}>
                        <AntDesign color={theme.colors.text.secondary} name="scan" size={20} />
                    </ActiveTouchAction>

                    <ActiveTouchAction onPress={handleOpenExplorer}>
                        <Image
                            source={{ uri: 'https://tonviewer.com/android-chrome-192x192.png' }}
                            style={styles.explorerIcon}
                        />
                    </ActiveTouchAction>
                </ScreenHeader.RightSide>
            </ScreenHeader.Container>

            {/* Wallet Switcher */}
            <WalletSwitcher
                activeWalletId={activeWalletId}
                isOpen={isWalletSwitcherOpen}
                onClose={() => setIsWalletSwitcherOpen(false)}
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
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    title: {
        textAlign: 'left',
    },
    chevron: {
        marginTop: 2,
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
    explorerIcon: {
        width: 20,
        height: 20,
        borderRadius: 4,
    },
}));
