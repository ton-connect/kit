/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import type { FC, ReactNode } from 'react';
import type { ViewProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ActiveTouchAction } from '../active-touch-action';
import { AppText } from '../app-text';
import { CircleLogo } from '../circle-logo';
import { LoaderCircle } from '../loader-circle';
import { TextAmount } from '../text-amount';

import { Column, Row } from '@/core/components/grid';
import { DotsLoader } from '@/core/components/dots-loader';

export interface Props extends ViewProps {
    logoUrl: string;
    title: ReactNode;
    ticker?: string;
    subtitle?: ReactNode;
    onPress?: () => void;
    isLoading?: boolean;
    isBalanceShown?: boolean;
    isBalanceLoading?: boolean;
    balance?: string;
    decimals?: number;
}

export const InputHeader: FC<Props> = ({
    logoUrl,
    subtitle,
    balance,
    ticker,
    isBalanceShown,
    isBalanceLoading,
    title,
    style,
    decimals,
    onPress,
    isLoading,
    ...props
}) => {
    const { theme } = useUnistyles();

    const isEmptyBalance = !balance || balance === '0';

    return (
        <Row style={[styles.container, style]} {...props}>
            <ActiveTouchAction hitSlop={10} onPress={onPress} scaling={1} style={styles.leftSide}>
                <Row style={[styles.item]}>
                    {onPress && (
                        <Ionicons
                            color={theme.colors.text.secondary}
                            name="chevron-down-circle"
                            size={22}
                            style={styles.openListButton}
                        />
                    )}

                    <CircleLogo.Logo source={logoUrl} style={styles.logo} />

                    <Column style={styles.leftSide}>
                        <Row style={styles.titleRow}>
                            <AppText style={styles.title} textType="h5">
                                {title}
                            </AppText>

                            {ticker && (
                                <AppText adjustsFontSizeToFit numberOfLines={1} style={styles.ticker} textType="h5">
                                    {ticker}
                                </AppText>
                            )}
                        </Row>

                        <Row>
                            {subtitle && (
                                <AppText style={styles.balance} textType="caption2">
                                    {subtitle}{' '}
                                </AppText>
                            )}

                            {isBalanceShown && (
                                <>
                                    <AppText style={styles.balance} textType="caption2">
                                        Balance
                                        {isBalanceLoading ? '  ' : ' '}
                                    </AppText>

                                    {isBalanceLoading && (
                                        <DotsLoader bounceHeight={4} color={theme.colors.text.default} size={2} />
                                    )}

                                    {!isBalanceLoading && (
                                        <TextAmount
                                            amount={balance || '0'}
                                            decimals={isEmptyBalance ? 1 : decimals}
                                            isDecimalsFixed={isEmptyBalance}
                                            style={styles.balance}
                                            textType="caption2"
                                        />
                                    )}
                                </>
                            )}
                        </Row>
                    </Column>
                </Row>
            </ActiveTouchAction>

            {isLoading && <LoaderCircle color={theme.colors.accent.primary} size={24} style={styles.loader} />}
        </Row>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        alignItems: 'center',
        marginBottom: sizes.space.vertical,
        flex: 1,
    },
    leftSide: {
        flex: 1,
    },
    item: {
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        marginRight: 10,
    },
    logo: {
        marginRight: 10,
    },
    titleRow: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        color: colors.text.highlight,
        marginRight: 4,
    },
    ticker: {
        flex: 1,
        color: colors.text.secondary,
        lineHeight: 0,
    },
    balance: {
        color: colors.text.secondary,
    },
    openListButton: {
        marginRight: 6,
    },
    chainBadge: {
        marginLeft: 8,
    },
    loader: {
        marginLeft: 'auto',
    },
}));
