/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useWallet } from '@demo/core';
import type { FC } from 'react';
import type { ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';
import { Skeleton } from '@/core/components/skeleton';
import { TextAmount } from '@/core/components/text-amount';
import { fromMinorUnit } from '@/core/utils/amount/minor-unit';

export const TonBalanceCard: FC<ViewProps> = ({ style, ...props }) => {
    const { address, balance } = useWallet();
    const isInitialized = !!address;

    const formattedBalance = balance ? fromMinorUnit(balance, 9).toString() : '0';

    return (
        <Block style={[styles.container, style]} {...props}>
            {isInitialized && (
                <AppText adjustsFontSizeToFit numberOfLines={1} style={styles.balanceContainer} textType="h2">
                    <TextAmount amount={formattedBalance} decimals={9} style={styles.balance} textType="h2" />
                    <AppText style={styles.currency} textType="h2">
                        {' '}
                        TON
                    </AppText>
                </AppText>
            )}

            {!isInitialized && <Skeleton style={styles.skeleton} />}

            {address && (
                <AppText ellipsizeMode="middle" numberOfLines={1} style={styles.address} textType="caption1">
                    {address}
                </AppText>
            )}
        </Block>
    );
};

const styles = StyleSheet.create(({ sizes, colors, fonts }) => ({
    container: {
        width: '100%',
        paddingVertical: sizes.space.vertical * 4,
        alignItems: 'center',
        backgroundColor: colors.accent.primary,
    },
    skeleton: {
        width: '40%',
        height: fonts.lineHeight.xl,
        marginBottom: sizes.space.vertical,
    },
    balanceContainer: {
        marginBottom: sizes.space.vertical,
        textAlign: 'center',
    },
    balance: {
        color: colors.text.inverted,
    },
    currency: {
        color: colors.text.inactive,
    },
    address: {
        maxWidth: '60%',
        textAlign: 'center',
        marginHorizontal: 'auto',
        color: colors.text.inactive,
    },
}));
