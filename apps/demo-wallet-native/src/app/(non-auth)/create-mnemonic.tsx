/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from 'react';
import type { FC } from 'react';
import { Alert, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { CreateTonMnemonic } from '@ton/walletkit';
import { router } from 'expo-router';
import { useAuth, useWallet } from '@ton/demo-core';

import { AppButton } from '@/core/components/app-button';
import { AppText } from '@/core/components/app-text';
import { InfoBlock } from '@/core/components/info-block';
import { ScreenHeader } from '@/core/components/screen-header';
import { ScreenWrapper } from '@/core/components/screen-wrapper';
import { TabControl } from '@/core/components/tab-control';
import { getErrorMessage } from '@/core/utils/errors/get-error-message';
import { MnemonicView } from '@/features/wallets';

const networkOptions = [
    { value: 'testnet' as const, label: 'Testnet' },
    { value: 'mainnet' as const, label: 'Mainnet' },
];

const CreateMnemonicScreen: FC = () => {
    const [mnemonic, setMnemonic] = useState<string[]>([]);
    const [network, setNetwork] = useState<'mainnet' | 'testnet'>('testnet');
    const [isWarningShown, setIsWarningShown] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const { createWallet } = useWallet();
    const { setUseWalletInterfaceType } = useAuth();

    const { theme } = useUnistyles();

    const handleGenerateMnemonic = useCallback(async () => {
        try {
            setIsWarningShown(false);
            setIsLoading(true);
            const words = await CreateTonMnemonic();
            setMnemonic(words);
        } catch (err) {
            setIsWarningShown(true);
            Alert.alert('Error', getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleContinue = async () => {
        try {
            setIsLoading(true);
            setUseWalletInterfaceType('mnemonic');
            await createWallet(mnemonic, undefined, undefined, network);
            router.replace('/(auth)/(tabs)/wallet');
        } catch (err) {
            Alert.alert('Error', getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <ScreenHeader.Container>
                <ScreenHeader.LeftSide>
                    <ScreenHeader.BackButton />
                </ScreenHeader.LeftSide>

                <ScreenHeader.Title>Recovery Phrase</ScreenHeader.Title>
            </ScreenHeader.Container>

            <View style={styles.content}>
                <View style={styles.header}>
                    <AppText style={styles.subtitle}>
                        Write down these 24 words in order and keep them safe. You'll need them to restore your wallet.
                    </AppText>
                </View>

                {!isWarningShown && <MnemonicView isLoading={isLoading && mnemonic.length === 0} mnemonic={mnemonic} />}

                {!isWarningShown && mnemonic.length > 0 && (
                    <View style={styles.networkSection}>
                        <AppText style={styles.sectionLabel}>Network</AppText>
                        <TabControl options={networkOptions} selectedOption={network} onOptionPress={setNetwork} />
                        <AppText style={styles.networkHint}>
                            {network === 'testnet'
                                ? 'Use testnet for development and testing with test TON.'
                                : 'Use mainnet for real transactions with real TON.'}
                        </AppText>
                    </View>
                )}

                {isWarningShown && (
                    <InfoBlock.Container>
                        <InfoBlock.IconWrapper style={styles.iconWrapper}>
                            <InfoBlock.Icon color={theme.colors.warning.foreground} name="alert-outline" withWrapper />
                        </InfoBlock.IconWrapper>

                        <InfoBlock.Title>Recovery phrase</InfoBlock.Title>

                        <InfoBlock.Subtitle>
                            Never share your recovery phrase with anyone. Store it securely offline.
                        </InfoBlock.Subtitle>

                        <AppButton.Container colorScheme="action" onPress={handleGenerateMnemonic}>
                            <AppButton.Text>Show Recovery Phrase</AppButton.Text>
                        </AppButton.Container>
                    </InfoBlock.Container>
                )}
            </View>

            {!isWarningShown && (
                <View style={styles.buttons}>
                    <AppButton.Container
                        colorScheme="primary"
                        disabled={isLoading || mnemonic.length === 0}
                        onPress={handleContinue}
                    >
                        <AppButton.Text>Continue</AppButton.Text>
                    </AppButton.Container>
                </View>
            )}
        </ScreenWrapper>
    );
};

export default CreateMnemonicScreen;

const styles = StyleSheet.create(({ sizes, colors }) => ({
    content: {
        flex: 1,
        paddingTop: sizes.space.vertical,
        paddingBottom: sizes.space.vertical * 2,
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
    networkSection: {
        gap: sizes.space.vertical / 2,
    },
    sectionLabel: {
        color: colors.text.highlight,
        fontSize: 14,
        fontWeight: '500',
    },
    networkHint: {
        color: colors.text.secondary,
        fontSize: 12,
        lineHeight: 16,
    },
    iconWrapper: {
        backgroundColor: colors.warning.default,
    },
    buttons: {
        padding: sizes.space.horizontal,
        paddingBottom: sizes.space.vertical * 5,
        gap: sizes.space.vertical,
        backgroundColor: colors.background.main,
        borderTopWidth: 1,
        borderTopColor: colors.navigation.default,
    },
}));
