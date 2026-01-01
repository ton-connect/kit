/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SavedWallet } from '@demo/core';
import { useState } from 'react';
import type { FC } from 'react';
import { Alert, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AddWalletButton } from './add-wallet-button';
import { WalletItem } from './wallet-item';

import { AppBottomSheet } from '@/core/components/app-bottom-sheet';

interface WalletSwitcherProps {
    savedWallets: SavedWallet[];
    activeWalletId?: string;
    isOpen: boolean;
    onClose: () => void;
    onSwitchWallet: (walletId: string) => void;
    onRemoveWallet: (walletId: string) => void;
    onRenameWallet: (walletId: string, newName: string) => void;
}

export const WalletSwitcher: FC<WalletSwitcherProps> = ({
    savedWallets,
    activeWalletId,
    isOpen,
    onClose,
    onSwitchWallet,
    onRemoveWallet,
    onRenameWallet,
}) => {
    const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const handleStartEdit = (wallet: SavedWallet) => {
        setEditingWalletId(wallet.id);
        setEditingName(wallet.name);
    };

    const handleSaveEdit = () => {
        if (editingWalletId && editingName.trim()) {
            onRenameWallet(editingWalletId, editingName.trim());
            setEditingWalletId(null);
            setEditingName('');
        }
    };

    const handleCancelEdit = () => {
        setEditingWalletId(null);
        setEditingName('');
    };

    const handleRemove = (walletId: string) => {
        Alert.alert('Remove Wallet', 'Are you sure you want to remove this wallet? This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                    onRemoveWallet(walletId);
                    if (savedWallets.length <= 1) {
                        onClose();
                    }
                },
            },
        ]);
    };

    const handleSwitchWallet = (walletId: string) => {
        onSwitchWallet(walletId);
        onClose();
    };

    if (savedWallets.length === 0) {
        return null;
    }

    return (
        <AppBottomSheet isOpened={isOpen} onClose={onClose} title="Select Wallet">
            <View style={styles.listContainer}>
                {savedWallets.map((wallet) => (
                    <WalletItem
                        key={wallet.id}
                        editingName={editingName}
                        isActive={wallet.id === activeWalletId}
                        isEditing={editingWalletId === wallet.id}
                        onCancelEdit={handleCancelEdit}
                        onChangeEditName={setEditingName}
                        onRemove={() => handleRemove(wallet.id)}
                        onSaveEdit={handleSaveEdit}
                        onStartEdit={() => handleStartEdit(wallet)}
                        onSwitch={() => handleSwitchWallet(wallet.id)}
                        wallet={wallet}
                    />
                ))}
                <AddWalletButton />
            </View>
        </AppBottomSheet>
    );
};

const styles = StyleSheet.create(({ sizes }) => ({
    listContainer: {
        flex: 1,
        gap: sizes.space.vertical,
    },
}));
