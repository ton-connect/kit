/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Alert, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { router } from 'expo-router';
import { useAuth, useWalletInitialization, useWallet, useJettons } from '@ton/demo-core';

import { AppButton } from '@/core/components/app-button';
import { AppInput } from '@/core/components/app-input';
import { AppText } from '@/core/components/app-text';
import { AppLogo } from '@/core/components/app-logo';
import { AppKeyboardAwareScrollView } from '@/core/components/keyboard-aware-scroll-view';

const UnlockWalletScreen: FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { unlock, reset } = useAuth();
    const { savedWallets, updateBalance } = useWallet();
    const { refreshJettons } = useJettons();
    const { initialize } = useWalletInitialization();

    const handleSubmit = async () => {
        setError('');
        setIsLoading(true);

        try {
            const success = await unlock(password);
            if (!success) {
                throw new Error('Invalid password');
            }

            await initialize();
            void Promise.allSettled([updateBalance(), refreshJettons()]);

            if (savedWallets.length === 0) {
                router.push('/(non-auth)/add-new-wallet');

                return;
            }

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
                        router.replace('/(non-auth)/add-new-wallet');
                    },
                },
            ],
        );
    };

    useEffect(() => {
        setError('');
    }, [password]);

    return (
        <AppKeyboardAwareScrollView showsVerticalScrollIndicator={false} style={styles.container}>
            <View style={styles.content}>
                <AppLogo size={100} style={styles.logo} />

                <AppText style={styles.title} textType="h3">
                    Welcome Back
                </AppText>

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
        </AppKeyboardAwareScrollView>
    );
};

export default UnlockWalletScreen;

const styles = StyleSheet.create(({ sizes, colors }, runtime) => ({
    container: {
        marginTop: runtime.insets.top,
        marginLeft: runtime.insets.left,
        marginRight: runtime.insets.right,
        paddingTop: sizes.page.paddingTop,
        paddingHorizontal: sizes.page.paddingHorizontal,
    },
    content: {
        flex: 1,
        paddingBottom: sizes.space.vertical,
        gap: sizes.space.vertical * 2,
    },
    logo: {
        marginTop: 100,
        marginHorizontal: 'auto',
    },
    title: {
        color: colors.text.highlight,
        textAlign: 'center',
    },
    subtitle: {
        color: colors.text.secondary,
        lineHeight: 20,
        textAlign: 'center',
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
