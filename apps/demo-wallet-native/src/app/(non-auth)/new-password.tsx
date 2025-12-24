/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useEffect, useState } from 'react';
import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@ton/demo-core';

import { AppButton } from '@/core/components/app-button';
import { AppInput } from '@/core/components/app-input';
import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';
import { ScreenHeader } from '@/core/components/screen-header';
import { ScreenWrapper } from '@/core/components/screen-wrapper';

const validatePassword = (pwd: string): string[] => {
    const errors = [];
    if (pwd.length < 4) errors.push('Password must be at least 4 characters long');
    // if (!/[A-Z]/.test(pwd)) errors.push('Password must contain at least one uppercase letter');
    // if (!/[a-z]/.test(pwd)) errors.push('Password must contain at least one lowercase letter');
    // if (!/[0-9]/.test(pwd)) errors.push('Password must contain at least one number');
    return errors;
};

const NewPasswordScreen: FC = () => {
    const { type } = useLocalSearchParams<{ type: 'create' | 'import' | 'ledger' }>();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { setPassword: setStorePassword } = useAuth();

    const getNextRoute = () => {
        switch (type) {
            case 'import':
                return '/(non-auth)/import-mnemonic';
            case 'ledger':
                return '/(non-auth)/connect-ledger';
            default:
                return '/(non-auth)/create-mnemonic';
        }
    };

    const handleSetPassword = async () => {
        setError('');
        setIsLoading(true);

        try {
            // Validate password
            const validationErrors = validatePassword(password);

            if (validationErrors.length > 0) {
                throw new Error(validationErrors[0]);
            }

            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            // Set password in store
            await setStorePassword(password);

            // Navigate to next step
            router.push(getNextRoute());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setError('');
    }, [password, confirmPassword]);

    return (
        <ScreenWrapper>
            <ScreenHeader.Container>
                <ScreenHeader.LeftSide>
                    <ScreenHeader.BackButton />
                </ScreenHeader.LeftSide>
                <ScreenHeader.Title>Create Password</ScreenHeader.Title>
            </ScreenHeader.Container>

            <View style={styles.content}>
                <AppText style={styles.subtitle}>
                    Your password will be used to encrypt your wallet data locally.
                </AppText>

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

                <AppInput
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect={false}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={confirmPassword}
                    secureTextEntry
                />

                {!!error && <AppText style={styles.errorText}>{error}</AppText>}

                <Block>
                    <AppText style={styles.infoText}>
                        💡 Make sure to remember your password. It cannot be recovered if forgotten.
                    </AppText>
                </Block>
            </View>

            <View style={styles.buttons}>
                <AppButton.Container colorScheme="primary" disabled={isLoading} onPress={handleSetPassword}>
                    <AppButton.Text>Continue</AppButton.Text>
                </AppButton.Container>
            </View>
        </ScreenWrapper>
    );
};

export default NewPasswordScreen;

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
