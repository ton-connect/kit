/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type FC, useState } from 'react';
import { Alert, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { router } from 'expo-router';
import { useWallet } from '@ton/demo-core';

import { AppButton } from '@/core/components/app-button';
import { AppInput } from '@/core/components/app-input';
import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';
import { ScreenHeader } from '@/core/components/screen-header';
import { ScreenWrapper } from '@/core/components/screen-wrapper';

const regexp = /\s+/;

const ImportMnemonicScreen: FC = () => {
    const [mnemonic, setMnemonic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { importWallet } = useWallet();

    const handleImport = async () => {
        if (!mnemonic.trim()) {
            Alert.alert('Error', 'Please enter your recovery phrase');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            const words = mnemonic.trim().toLowerCase().split(regexp).filter(Boolean);
            await importWallet(words);
            router.replace('/(auth)/(tabs)/wallet');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to import wallet';
            setError(errorMessage);
            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const wordCount = mnemonic.trim().split(regexp).filter(Boolean).length;

    return (
        <ScreenWrapper>
            <ScreenHeader.Container>
                <ScreenHeader.LeftSide>
                    <ScreenHeader.BackButton />
                </ScreenHeader.LeftSide>
                <ScreenHeader.Title>Import Wallet</ScreenHeader.Title>
            </ScreenHeader.Container>

            <View style={styles.content}>
                <View style={styles.header}>
                    <AppText style={styles.title} textType="h3">
                        Enter Recovery Phrase
                    </AppText>
                    <AppText style={styles.subtitle}>
                        Enter your 12 or 24 word recovery phrase to restore your wallet.
                    </AppText>
                </View>

                <View style={styles.inputContainer}>
                    <AppInput
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect={false}
                        multiline
                        numberOfLines={6}
                        onChangeText={setMnemonic}
                        placeholder="Enter your recovery phrase..."
                        placeholderTextColor="#999"
                        style={styles.input}
                        textAlignVertical="top"
                        value={mnemonic}
                    />
                    <AppText style={styles.wordCount}>
                        {wordCount} {wordCount === 1 ? 'word' : 'words'}
                    </AppText>
                </View>

                <Block>
                    <AppText style={styles.infoText}>
                        💡 Separate words with spaces. The phrase is case-insensitive.
                    </AppText>
                </Block>
            </View>

            <View style={styles.buttons}>
                <AppButton.Container
                    colorScheme="primary"
                    disabled={isLoading || (wordCount !== 12 && wordCount !== 24)}
                    onPress={handleImport}
                >
                    <AppButton.Text>Import Wallet</AppButton.Text>
                </AppButton.Container>
            </View>
        </ScreenWrapper>
    );
};

export default ImportMnemonicScreen;

const styles = StyleSheet.create(({ sizes, colors }) => ({
    content: {
        flex: 1,
        paddingVertical: sizes.space.vertical,
        gap: sizes.space.vertical * 2,
    },
    header: {
        gap: sizes.space.vertical,
    },
    title: {
        color: colors.text.highlight,
    },
    subtitle: {
        color: colors.text.secondary,
        lineHeight: 20,
    },
    inputContainer: {
        gap: sizes.space.vertical / 2,
    },
    input: {
        backgroundColor: colors.background.block,
        color: colors.text.highlight,
        minHeight: 150,
        borderRadius: sizes.borderRadius.md,
        paddingVertical: sizes.block.paddingVertical,
        paddingHorizontal: sizes.block.paddingHorizontal,
        borderColor: colors.navigation.default,
    },
    wordCount: {
        fontSize: 12,
        color: colors.text.secondary,
        textAlign: 'right',
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
        borderTopWidth: 1,
        borderTopColor: colors.navigation.default,
    },
}));
