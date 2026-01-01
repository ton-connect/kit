/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { FC } from 'react';
import { Alert, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { router } from 'expo-router';
import { useWallet } from '@demo/core';

import { AppButton } from '@/core/components/app-button';
import { AppInput } from '@/core/components/app-input';
import { AppText } from '@/core/components/app-text';
import { ScreenHeader } from '@/core/components/screen-header';
import { ScreenWrapper } from '@/core/components/screen-wrapper';
import { TabControl } from '@/core/components/tab-control';

const regexp = /\s+/;

const networkOptions = [
    { value: 'testnet' as const, label: 'Testnet' },
    { value: 'mainnet' as const, label: 'Mainnet' },
];

const ImportMnemonicScreen: FC = () => {
    const [mnemonic, setMnemonic] = useState('');
    const [network, setNetwork] = useState<'mainnet' | 'testnet'>('testnet');
    const [isLoading, setIsLoading] = useState(false);
    const [, setError] = useState('');

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
            await importWallet(words, undefined, undefined, network);
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

                <View style={styles.networkSection}>
                    <AppText style={styles.sectionLabel}>Network</AppText>
                    <TabControl options={networkOptions} selectedOption={network} onOptionPress={setNetwork} />
                    <AppText style={styles.networkHint} textType="caption1">
                        {network === 'testnet'
                            ? 'Use testnet for development and testing with test TON.'
                            : 'Use mainnet for real transactions with real TON.'}
                    </AppText>
                </View>
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
    networkSection: {
        gap: sizes.space.vertical / 2,
    },
    sectionLabel: {
        color: colors.text.highlight,
        marginBottom: sizes.space.vertical / 2,
    },
    networkHint: {
        marginTop: sizes.space.vertical / 2,
        color: colors.text.secondary,
        textAlign: 'center',
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
