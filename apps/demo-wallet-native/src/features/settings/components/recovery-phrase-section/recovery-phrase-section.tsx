/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import { getDecryptedMnemonic } from '@demo/core';
import { setStringAsync } from 'expo-clipboard';
import { useState } from 'react';
import type { FC } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppButton } from '@/core/components/app-button';
import { AppModal } from '@/core/components/app-modal';
import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';
import { getErrorMessage } from '@/core/utils/errors/get-error-message';
import { useAppToasts } from '@/features/toasts';
import { MnemonicView } from '@/features/wallets';

export const RecoveryPhraseSection: FC = () => {
    const [showMnemonic, setShowMnemonic] = useState(false);
    const [mnemonic, setMnemonic] = useState<string[]>([]);

    const { theme } = useUnistyles();
    const { toast } = useAppToasts();

    const handleShowMnemonic = async () => {
        try {
            const storedMnemonic = await getDecryptedMnemonic();
            if (storedMnemonic) {
                setMnemonic(storedMnemonic);
                setShowMnemonic(true);
            } else {
                Alert.alert('Error', 'No mnemonic found');
            }
        } catch (error) {
            Alert.alert('Error', getErrorMessage(error, 'Failed to retrieve mnemonic'));
        }
    };

    const handleHideMnemonic = () => {
        setShowMnemonic(false);
        setMnemonic([]);
    };

    const handleCopyMnemonic = async () => {
        try {
            await setStringAsync(mnemonic.join(' '));
            toast({ type: 'success', title: 'Copied!' });
        } catch (error) {
            toast({ type: 'error', title: getErrorMessage(error, 'Failed to copy to clipboard') });
        }
    };

    return (
        <View>
            <AppText style={styles.sectionTitle} textType="h3">
                Recovery Phrase
            </AppText>

            <Block>
                <View style={styles.warningContainer}>
                    <Ionicons color={theme.colors.warning.default} name="warning-outline" size={24} />
                    <AppText style={styles.warningText}>Never share your recovery phrase with anyone</AppText>
                </View>

                <AppButton.Container colorScheme="secondary" onPress={handleShowMnemonic}>
                    <AppButton.Text>Show Recovery Phrase</AppButton.Text>
                </AppButton.Container>
            </Block>

            <AppModal onRequestClose={handleHideMnemonic} visible={showMnemonic}>
                <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
                    <View style={styles.header}>
                        <AppText style={styles.title} textType="h3">
                            Recovery Phrase
                        </AppText>

                        <ActiveTouchAction onPress={handleHideMnemonic} style={styles.closeButton}>
                            <Ionicons color={theme.colors.text.default} name="close-outline" size={24} />
                        </ActiveTouchAction>
                    </View>

                    <View style={styles.sheetContent}>
                        <View style={styles.sheetHeader}>
                            <AppText style={styles.sheetSubtitle}>
                                Write down these words in order and keep them safe. You'll need them to restore your
                                wallet.
                            </AppText>
                        </View>

                        <MnemonicView mnemonic={mnemonic} />

                        <AppButton.Container colorScheme="secondary" onPress={handleCopyMnemonic}>
                            <AppButton.Text>Copy to Clipboard</AppButton.Text>
                        </AppButton.Container>
                    </View>
                </ScrollView>
            </AppModal>
        </View>
    );
};

const styles = StyleSheet.create(({ sizes, colors }, runtime) => ({
    container: {
        paddingHorizontal: sizes.page.paddingHorizontal,
        paddingVertical: sizes.block.paddingVertical,
        marginBottom: runtime.insets.bottom * 2,
    },
    header: {
        position: 'relative',
        marginTop: 10,
        marginBottom: 20,
    },
    title: {
        color: colors.text.highlight,
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 0,
        right: 12,
    },
    sectionTitle: {
        color: colors.text.highlight,
        marginBottom: 20,
        textAlign: 'center',
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizes.space.horizontal / 2,
        marginBottom: sizes.space.vertical,
    },
    warningText: {
        color: colors.text.default,
        fontSize: 14,
        flex: 1,
    },
    sheetContent: {
        gap: sizes.space.vertical * 2,
        paddingBottom: sizes.space.vertical * 2,
    },
    sheetHeader: {
        gap: sizes.space.vertical,
    },
    sheetSubtitle: {
        color: colors.text.secondary,
        lineHeight: 20,
        textAlign: 'center',
    },
    sheetWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizes.space.horizontal / 2,
        padding: sizes.space.vertical,
        backgroundColor: colors.error.foreground,
        borderRadius: sizes.borderRadius.md,
        borderLeftWidth: 4,
        borderLeftColor: colors.error.default,
    },
    sheetWarningText: {
        flex: 1,
        color: colors.text.default,
        fontSize: 14,
        lineHeight: 20,
    },
}));
