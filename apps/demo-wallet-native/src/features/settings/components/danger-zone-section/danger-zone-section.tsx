/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '@demo/core';
import { router } from 'expo-router';
import type { FC } from 'react';
import { Alert, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton } from '@/core/components/app-button';
import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';

export const DangerZoneSection: FC = () => {
    const { theme } = useUnistyles();
    const { clearWallet } = useWallet();

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone. Make sure you have backed up your recovery phrase.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        clearWallet();
                        router.replace('/(non-auth)/new-password');
                    },
                },
            ],
        );
    };

    return (
        <View>
            <AppText style={styles.sectionTitle} textType="h3">
                Danger Zone
            </AppText>

            <Block style={styles.dangerBlock}>
                <View style={styles.dangerContent}>
                    <Ionicons color={theme.colors.error.default} name="trash-outline" size={24} />
                    <View style={styles.dangerInfo}>
                        <AppText style={styles.dangerTitle}>Delete Account</AppText>
                        <AppText style={styles.dangerDescription}>
                            Permanently delete your wallet. Make sure to backup your recovery phrase first.
                        </AppText>
                    </View>
                </View>
                <AppButton.Container colorScheme="secondary" onPress={handleDeleteAccount}>
                    <AppButton.Text>Delete Account</AppButton.Text>
                </AppButton.Container>
            </Block>
        </View>
    );
};

const styles = StyleSheet.create(({ sizes, colors }) => ({
    sectionTitle: {
        color: colors.text.highlight,
        marginBottom: 20,
        textAlign: 'center',
    },
    dangerBlock: {
        marginBottom: 20,
    },
    dangerContent: {
        flexDirection: 'row',
        gap: sizes.space.horizontal,
        marginBottom: sizes.space.vertical,
    },
    dangerInfo: {
        flex: 1,
        gap: sizes.space.vertical / 4,
    },
    dangerTitle: {
        color: colors.error.default,
        fontSize: 16,
        fontWeight: '600',
    },
    dangerDescription: {
        color: colors.text.secondary,
        fontSize: 14,
        lineHeight: 20,
    },
}));
