/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { formatAddress } from '@demo/wallet-core';
import type { SavedWallet } from '@demo/wallet-core';
import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/core/components/app-text';

interface WalletItemInfoProps {
    wallet: SavedWallet;
}

export const WalletItemInfo: FC<WalletItemInfoProps> = ({ wallet }) => {
    const networkLabel = wallet.network === 'mainnet' ? 'Mainnet' : 'Testnet';

    return (
        <View style={styles.container}>
            <View style={styles.nameRow}>
                <AppText style={styles.name} textType="body1">
                    {wallet.name}
                </AppText>
                <View style={[styles.badge, wallet.network === 'mainnet' ? styles.badgeMainnet : styles.badgeTestnet]}>
                    <AppText style={styles.badgeText}>{networkLabel}</AppText>
                </View>
            </View>

            <AppText style={styles.address} textType="caption1">
                {formatAddress(wallet.address)}
            </AppText>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.sizes.space.horizontal / 2,
    },
    name: {
        color: theme.colors.text.highlight,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeMainnet: {
        backgroundColor: theme.colors.accent.primary + '20',
    },
    badgeTestnet: {
        backgroundColor: theme.colors.warning.default + '30',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    address: {
        color: theme.colors.text.secondary,
        fontFamily: 'monospace',
    },
}));
