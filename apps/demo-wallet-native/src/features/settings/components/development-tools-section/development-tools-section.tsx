/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import { useWalletKit } from '@demo/core';
import type { FC } from 'react';
import { useCallback } from 'react';
import { Alert, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton } from '@/core/components/app-button';
import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';

export const DevelopmentToolsSection: FC = () => {
    const { theme } = useUnistyles();
    const walletKit = useWalletKit();

    const handleTestDisconnectAll = useCallback(async () => {
        if (!walletKit) return;
        try {
            await walletKit.disconnect();
            Alert.alert('Success', 'All sessions disconnected');
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to disconnect sessions:', err);
            Alert.alert('Error', 'Failed to disconnect sessions');
        }
    }, [walletKit]);

    return (
        <View>
            <AppText style={styles.sectionTitle} textType="h3">
                Development Tools
            </AppText>

            <Block style={styles.block}>
                <View style={styles.content}>
                    <Ionicons color={theme.colors.accent.primary} name="code-slash-outline" size={24} />
                    <View style={styles.info}>
                        <AppText style={styles.title}>Disconnect All Sessions</AppText>
                        <AppText style={styles.description}>Test disconnect event functionality</AppText>
                    </View>
                </View>
                <AppButton.Container colorScheme="secondary" onPress={handleTestDisconnectAll}>
                    <AppButton.Text>Disconnect All</AppButton.Text>
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
    block: {
        marginBottom: 20,
    },
    content: {
        flexDirection: 'row',
        gap: sizes.space.horizontal,
        marginBottom: sizes.space.vertical,
    },
    info: {
        flex: 1,
        gap: sizes.space.vertical / 4,
    },
    title: {
        color: colors.text.highlight,
        fontSize: 16,
        fontWeight: '600',
    },
    description: {
        color: colors.text.secondary,
        fontSize: 14,
        lineHeight: 20,
    },
}));
