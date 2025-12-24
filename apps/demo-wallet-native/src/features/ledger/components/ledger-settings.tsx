/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/core/components/app-text';
import { TabControl } from '@/core/components/tab-control';
import { AppInput } from '@/core/components/app-input';

const networkOptions = [
    { value: 'testnet' as const, label: 'Testnet' },
    { value: 'mainnet' as const, label: 'Mainnet' },
];

interface LedgerSettingsProps {
    network: 'mainnet' | 'testnet';
    onNetworkChange: (network: 'mainnet' | 'testnet') => void;
    accountNumber: number;
    onAccountNumberChange: (accountNumber: number) => void;
}

export const LedgerSettings: FC<LedgerSettingsProps> = ({
    network,
    onNetworkChange,
    accountNumber,
    onAccountNumberChange,
}) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <AppText style={styles.label}>Network</AppText>
                <TabControl options={networkOptions} selectedOption={network} onOptionPress={onNetworkChange} />
                <AppText style={styles.hint}>
                    {network === 'testnet'
                        ? 'Use testnet for development and testing.'
                        : 'Use mainnet for real transactions.'}
                </AppText>
            </View>

            <View style={styles.section}>
                <AppText style={styles.label}>Account Index</AppText>
                <AppInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={String(accountNumber)}
                    onChangeText={(text) => {
                        const num = parseInt(text, 10);
                        onAccountNumberChange(isNaN(num) ? 0 : Math.max(0, num));
                    }}
                    placeholder="0"
                    placeholderTextColor={theme.colors.text.secondary}
                />
                <AppText style={styles.hint}>
                    Select which account to use from your Ledger device (0-based index).
                </AppText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        gap: sizes.space.vertical * 2,
    },
    section: {
        gap: sizes.space.vertical / 2,
    },
    label: {
        color: colors.text.highlight,
        fontWeight: '500',
        fontSize: 14,
    },
    hint: {
        color: colors.text.secondary,
        fontSize: 12,
        lineHeight: 16,
    },
    input: {
        backgroundColor: colors.background.block,
        color: colors.text.highlight,
        borderRadius: sizes.borderRadius.md,
        paddingVertical: sizes.block.paddingVertical,
        paddingHorizontal: sizes.block.paddingHorizontal,
        borderColor: colors.navigation.default,
    },
}));
