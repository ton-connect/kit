/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Wallet } from '@ton/walletkit';
import { useWallet } from '@demo/wallet-core';
import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { WalletInfoBlock } from '../wallet-info-block';

import { AppBottomSheet } from '@/core/components/app-bottom-sheet';
import { ActiveTouchAction } from '@/core/components/active-touch-action';

interface WalletSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    wallets: Wallet[];

    selectedWallet: Wallet | null;
    onSelectWallet: (wallet: Wallet) => void;
    title?: string;
}

export const WalletSelectorModal: FC<WalletSelectorModalProps> = ({
    isOpen,
    onClose,
    wallets,
    selectedWallet,
    onSelectWallet,
    title = 'Select Wallet',
}) => {
    const { savedWallets } = useWallet();

    const handleSelect = (wallet: Wallet) => {
        onSelectWallet(wallet);
        onClose();
    };

    return (
        <AppBottomSheet isOpened={isOpen} onClose={onClose} title={title}>
            <View style={styles.list}>
                {wallets.map((wallet, index) => {
                    const address = wallet.getAddress();
                    const savedWallet = savedWallets.find((w) => w.address === address);
                    const isSelected = selectedWallet === wallet;

                    return (
                        <ActiveTouchAction onPress={() => handleSelect(wallet)}>
                            <WalletInfoBlock
                                key={index}
                                style={isSelected && styles.selected}
                                name={savedWallet?.name || `Wallet ${index + 1}`}
                                address={address}
                            />
                        </ActiveTouchAction>
                    );
                })}
            </View>
        </AppBottomSheet>
    );
};

const styles = StyleSheet.create(({ sizes, colors }) => ({
    list: {
        gap: sizes.space.vertical / 2,
    },
    selected: {
        borderColor: colors.accent.primary,
        borderWidth: 2,
    },
}));
