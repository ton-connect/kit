/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useWalletStore } from '@demo/wallet-core';

import { AppButton } from '@/core/components/app-button';
import { AppLogo } from '@/core/components/app-logo';
import { AppText } from '@/core/components/app-text';

const StartScreen: FC = () => {
    const isPasswordSet = useWalletStore((state) => state.auth.isPasswordSet);
    const { theme } = useUnistyles();

    const router = useRouter();

    const handleCreateNew = () => {
        if (isPasswordSet) {
            router.push('/(non-auth)/create-mnemonic');
            return;
        }

        router.push({
            pathname: '/(non-auth)/new-password',
            params: { type: 'create' },
        });
    };

    const handleImport = () => {
        if (isPasswordSet) {
            router.push('/(non-auth)/import-mnemonic');
            return;
        }

        router.push({
            pathname: '/(non-auth)/new-password',
            params: { type: 'import' },
        });
    };

    const handleConnectLedger = () => {
        if (isPasswordSet) {
            router.push('/(non-auth)/connect-ledger');
            return;
        }

        router.push({
            pathname: '/(non-auth)/new-password',
            params: { type: 'ledger' },
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <AppLogo size={100} />

                <View style={styles.header}>
                    <AppText style={styles.title} textType="h2">
                        TON Wallet
                    </AppText>
                    <AppText style={styles.subtitle}>Create a new wallet or import an existing one</AppText>
                </View>

                <View style={styles.buttons}>
                    <AppButton.Container colorScheme="primary" onPress={handleCreateNew}>
                        <AppButton.Text>Create New Wallet</AppButton.Text>
                    </AppButton.Container>

                    <AppButton.Container colorScheme="secondary" onPress={handleImport}>
                        <AppButton.Text>Import Wallet</AppButton.Text>
                    </AppButton.Container>

                    <AppButton.Container colorScheme="secondary" onPress={handleConnectLedger}>
                        <Ionicons
                            name="hardware-chip-outline"
                            size={18}
                            color={theme.colors.text.highlight}
                            style={styles.ledgerIcon}
                        />
                        <AppButton.Text>Connect Ledger</AppButton.Text>
                    </AppButton.Container>
                </View>
            </View>
        </View>
    );
};

export default StartScreen;

const styles = StyleSheet.create(({ sizes, colors }) => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: sizes.space.horizontal,
    },
    content: {
        width: '100%',
        gap: sizes.space.vertical,
        alignItems: 'center',
    },
    header: {
        marginVertical: sizes.space.vertical,
        gap: sizes.space.vertical,
        alignItems: 'center',
    },
    title: {
        textAlign: 'center',
        color: colors.text.highlight,
    },
    subtitle: {
        textAlign: 'center',
        maxWidth: 280,
    },
    buttons: {
        marginTop: sizes.space.vertical * 4,
        width: '100%',
        gap: sizes.space.vertical,
    },
    ledgerIcon: {
        marginRight: 8,
    },
}));
