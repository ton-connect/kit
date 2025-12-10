/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { IWallet } from '@ton/walletkit';
import { useWallet } from '@ton/demo-core';
import type { FC } from 'react';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { WalletInfoBlock } from '../wallet-info-block';

import { AppBottomSheet } from '@/core/components/app-bottom-sheet';
import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppModal } from '@/core/components/app-modal';
import { ScreenHeader } from '@/core/components/screen-header';

interface WalletSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    wallets: IWallet[];

    selectedWallet: IWallet | null;
    onSelectWallet: (wallet: IWallet) => void;
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

    const handleSelect = (wallet: IWallet) => {
        onSelectWallet(wallet);
        onClose();
    };

    return (
        <AppModal visible={isOpen} onRequestClose={onClose}>
            <ScreenHeader.Container type="modal">
                <ScreenHeader.Title>{title}</ScreenHeader.Title>
                <ScreenHeader.CloseButton onPress={onClose} />
            </ScreenHeader.Container>

            <ScrollView style={styles.contentContainer}>
                {wallets.map((wallet, index) => {
                    const address = wallet.getAddress();
                    const savedWallet = savedWallets.find((w) => w.address === address);
                    const isSelected = selectedWallet === wallet;

                    return (
                        <ActiveTouchAction key={wallet.getWalletId()} onPress={() => handleSelect(wallet)}>
                            <WalletInfoBlock
                                key={index}
                                style={isSelected && styles.selected}
                                name={savedWallet?.name || `Wallet ${index + 1}`}
                                address={address}
                            />
                        </ActiveTouchAction>
                    );
                })}
            </ScrollView>
        </AppModal>
    );
};

const styles = StyleSheet.create(({ sizes, colors }, runtime) => ({
    contentContainer: {
        paddingBottom: runtime.insets.bottom + sizes.page.paddingBottom,
        paddingHorizontal: sizes.page.paddingHorizontal,
        marginLeft: runtime.insets.left,
        marginRight: runtime.insets.right,
        gap: sizes.space.vertical / 2,
    },
    selected: {
        borderColor: colors.accent.primary,
        borderWidth: 2,
    },
}));
