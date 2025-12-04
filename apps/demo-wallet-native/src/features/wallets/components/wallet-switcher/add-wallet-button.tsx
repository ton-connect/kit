/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import { type FC } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { router } from 'expo-router';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppText } from '@/core/components/app-text';

export const AddWalletButton: FC = () => {
    const { theme } = useUnistyles();

    const handleCreateNew = () => {
        router.push('/(non-auth)/create-mnemonic');
    };

    const handleImport = () => {
        router.push('/(non-auth)/import-mnemonic');
    };

    return (
        <View style={styles.container}>
            <ActiveTouchAction onPress={handleCreateNew} style={styles.button}>
                <Ionicons color={theme.colors.accent.primary} name="add-circle-outline" size={20} />
                <AppText style={[styles.text, { color: theme.colors.accent.primary }]} textType="body2">
                    Create New Wallet
                </AppText>
            </ActiveTouchAction>

            <ActiveTouchAction onPress={handleImport} style={styles.button}>
                <Ionicons color={theme.colors.accent.primary} name="arrow-down-circle-outline" size={20} />
                <AppText style={[styles.text, { color: theme.colors.accent.primary }]} textType="body2">
                    Import Existing Wallet
                </AppText>
            </ActiveTouchAction>
        </View>
    );
};

const styles = StyleSheet.create(({ sizes }) => ({
    container: {
        marginTop: sizes.space.vertical * 2,
        gap: sizes.space.vertical * 2,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    text: {
        fontWeight: '600',
    },
}));
