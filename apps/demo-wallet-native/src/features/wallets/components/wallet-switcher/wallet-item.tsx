/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SavedWallet } from '@demo/wallet-core';
import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { WalletEditForm } from './wallet-edit-form';
import { WalletItemActions } from './wallet-item-actions';
import { WalletItemInfo } from './wallet-item-info';

import { Block } from '@/core/components/block';
import { ActiveTouchAction } from '@/core/components/active-touch-action';

interface WalletItemProps {
    wallet: SavedWallet;
    isActive: boolean;
    isEditing: boolean;
    editingName: string;
    onStartEdit: () => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onChangeEditName: (name: string) => void;
    onSwitch: () => void;
    onRemove: () => void;
}

export const WalletItem: FC<WalletItemProps> = ({
    wallet,
    isActive,
    isEditing,
    editingName,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onChangeEditName,
    onSwitch,
    onRemove,
}) => {
    return (
        <ActiveTouchAction onPress={onSwitch} disabled={isActive}>
            <Block style={[styles.container, isActive && styles.active]}>
                <View style={styles.content}>
                    {isEditing ? (
                        <WalletEditForm
                            onCancel={onCancelEdit}
                            onChangeText={onChangeEditName}
                            onSave={onSaveEdit}
                            value={editingName}
                        />
                    ) : (
                        <>
                            <WalletItemInfo wallet={wallet} />
                            <WalletItemActions onEdit={onStartEdit} onRemove={onRemove} />
                        </>
                    )}
                </View>
            </Block>
        </ActiveTouchAction>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        paddingVertical: sizes.block.paddingVertical - 4,
    },
    active: {
        // borderWidth: 1,
        borderColor: colors.accent.primary,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
}));
