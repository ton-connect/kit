/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { LedgerSettings } from '../ledger-settings';

import { AppButton } from '@/core/components/app-button';
import { AppText } from '@/core/components/app-text';

interface Props {
    deviceName?: string;
    network: 'mainnet' | 'testnet';
    onNetworkChange: (network: 'mainnet' | 'testnet') => void;
    accountNumber: number;
    onAccountNumberChange: (accountNumber: number) => void;
    onCreateWallet: () => void;
}

export const ConfigureStep: FC<Props> = ({
    deviceName,
    network,
    onNetworkChange,
    accountNumber,
    onAccountNumberChange,
    onCreateWallet,
}) => {
    const { theme } = useUnistyles();

    return (
        <>
            <View style={styles.connectedDevice}>
                <AppText style={styles.connectedLabel}>Connected to</AppText>
                <AppText style={styles.connectedName} textType="h4">
                    {deviceName}
                </AppText>
            </View>
            <LedgerSettings
                network={network}
                onNetworkChange={onNetworkChange}
                accountNumber={accountNumber}
                onAccountNumberChange={onAccountNumberChange}
            />
            <View style={styles.warningBox}>
                <Ionicons name="warning-outline" size={20} color={theme.colors.warning.foreground} />
                <AppText style={styles.warningText}>
                    Make sure the TON app is open on your Ledger device before continuing
                </AppText>
            </View>
            <View style={styles.buttonContainer}>
                <AppButton.Container colorScheme="primary" onPress={onCreateWallet}>
                    <AppButton.Text>Create Wallet</AppButton.Text>
                </AppButton.Container>
            </View>
        </>
    );
};

const styles = StyleSheet.create(({ sizes, colors }) => ({
    connectedDevice: {
        padding: sizes.space.horizontal,
        backgroundColor: colors.success.default + '20',
        borderRadius: sizes.borderRadius.md,
        alignItems: 'center',
        gap: 4,
    },
    connectedLabel: {
        color: colors.text.secondary,
        fontSize: 12,
    },
    connectedName: {
        color: colors.text.highlight,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: sizes.space.horizontal,
        padding: sizes.space.horizontal,
        backgroundColor: colors.warning.default + '20',
        borderRadius: sizes.borderRadius.md,
        borderWidth: 1,
        borderColor: colors.warning.default + '40',
    },
    warningText: {
        flex: 1,
        color: colors.warning.foreground,
        fontSize: 13,
        lineHeight: 18,
    },
    buttonContainer: {
        marginTop: sizes.space.vertical,
    },
}));
