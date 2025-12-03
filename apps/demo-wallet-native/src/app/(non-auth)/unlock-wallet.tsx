/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type FC, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { router } from 'expo-router';
import { useAuth, useWallet } from '@ton/demo-core';

import { AppButton } from '@/core/components/app-button';
import { AppInput } from '@/core/components/app-input';
import { AppText } from '@/core/components/app-text';
import { ScreenHeader } from '@/core/components/screen-header';
import { ScreenWrapper } from '@/core/components/screen-wrapper';

const UnlockWalletScreen: FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { unlock, reset } = useAuth();
    const { loadAllWallets } = useWallet();

    const handleSubmit = async () => {
        setError('');
        setIsLoading(true);

        try {
            const success = await unlock(password);
            if (!success) {
                throw new Error('Invalid password');
            }

            // Load wallet data after successful unlock
            await loadAllWallets();

            // Navigate to wallet
            // navigate('/wallet');
            router.push('/(auth)/(tabs)/wallet');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to unlock wallet');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        Alert.alert(
            'Reset Wallet',
            'Are you sure you want to reset your wallet? This will delete all wallet data permanently.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => {
                        reset();
                        router.replace('/(non-auth)/start');
                    },
                },
            ],
        );
    };

    useEffect(() => {
        setError('');
    }, [password]);

    return (
        <ScreenWrapper>
            <ScreenHeader.Container>
                <ScreenHeader.Title>Welcome Back</ScreenHeader.Title>
            </ScreenHeader.Container>

            <View style={styles.content}>
                <AppText style={styles.subtitle}>Enter your password to unlock your wallet.</AppText>

                <AppInput
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect={false}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={password}
                    secureTextEntry
                />

                {!!error && <AppText style={styles.errorText}>{error}</AppText>}
            </View>

            <View style={styles.buttons}>
                <AppButton.Container colorScheme="primary" disabled={isLoading} onPress={handleSubmit}>
                    <AppButton.Text>Continue</AppButton.Text>
                </AppButton.Container>

                <AppButton.Container colorScheme="secondary" disabled={isLoading} onPress={handleReset}>
                    <AppButton.Text>Reset Wallet</AppButton.Text>
                </AppButton.Container>
            </View>
        </ScreenWrapper>
    );
};

export default UnlockWalletScreen;

const styles = StyleSheet.create(({ sizes, colors }) => ({
    content: {
        flex: 1,
        paddingBottom: sizes.space.vertical,
        gap: sizes.space.vertical * 2,
    },
    subtitle: {
        color: colors.text.secondary,
        lineHeight: 20,
    },
    input: {
        backgroundColor: colors.background.block,
        color: colors.text.highlight,
        borderRadius: sizes.borderRadius.md,
        paddingVertical: sizes.block.paddingVertical,
        paddingHorizontal: sizes.block.paddingHorizontal,
        borderColor: colors.navigation.default,
    },
    infoText: {
        color: colors.text.default,
        fontSize: 14,
        lineHeight: 20,
    },
    buttons: {
        marginTop: sizes.space.vertical,
        paddingVertical: sizes.space.vertical * 2,
        gap: sizes.space.vertical,
        backgroundColor: colors.background.main,
    },
    errorText: {
        marginVertical: sizes.space.vertical,
        textAlign: 'center',
        marginHorizontal: sizes.space.horizontal,
        color: colors.error.default,
    },
}));
