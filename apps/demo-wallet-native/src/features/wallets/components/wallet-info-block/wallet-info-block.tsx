/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import type { FC } from 'react';
import { View, type ViewProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { formatAddress } from '@ton/demo-core';

import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';

interface WalletInfoBlockProps extends ViewProps {
    name: string;
    address: string;
}

export const WalletInfoBlock: FC<WalletInfoBlockProps> = ({ name, address, style, ...props }) => {
    const { theme } = useUnistyles();

    return (
        <Block style={[styles.container, style]} {...props}>
            <View style={styles.icon}>
                <Ionicons name="wallet-outline" size={20} color={theme.colors.text.highlight} />
            </View>

            <View style={styles.info}>
                <AppText style={styles.name} textType="body1">
                    {name}
                </AppText>

                <AppText style={styles.address} textType="caption1">
                    {formatAddress(address)}
                </AppText>
            </View>
        </Block>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: sizes.space.horizontal / 2,
        backgroundColor: colors.background.secondary,
        gap: sizes.space.horizontal / 2,
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background.main,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
        gap: 2,
    },
    name: {
        color: colors.text.highlight,
    },
    address: {
        color: colors.text.secondary,
    },
}));
