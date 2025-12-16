/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC } from 'react';
import type { ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ActiveTouchAction } from '../active-touch-action';
import { AppText } from '../app-text';

import { Row } from '@/core/components/grid';
import { Big } from '@/core/libs/big-number';
import { formatAmount } from '@/core/utils/amount/format-amount';

export interface Props extends ViewProps {
    amount: string;
    onChangeAmount: (amount: string) => void;
    decimals?: number;
    balance?: string;
    disabled?: boolean;
}

export const BalancePercents: FC<Props> = ({
    amount,
    balance,
    onChangeAmount,
    decimals = 6,
    disabled,
    style,
    ...props
}) => {
    const percents = useMemo(() => {
        const bigBal = Big(balance || '0');

        return {
            '10%': formatAmount(bigBal.multipliedBy(0.1), decimals),
            '25%': formatAmount(bigBal.multipliedBy(0.25), decimals),
            '50%': formatAmount(bigBal.multipliedBy(0.5), decimals),
            MAX: bigBal.toString(),
        };
    }, [balance, decimals]);

    const handlePress = (percent: string) => (): void => {
        onChangeAmount(percents[percent as 'MAX']);
    };

    return (
        <Row style={[styles.container, style]} {...props}>
            {Object.entries(percents).map(([key, value]) => (
                <ActiveTouchAction disabled={disabled} key={key} onPress={handlePress(key)}>
                    <AppText style={[styles.bubbleButton, amount === value && styles.bubbleActive]} textType="caption1">
                        {key}
                    </AppText>
                </ActiveTouchAction>
            ))}
        </Row>
    );
};

const styles = StyleSheet.create(({ colors, sizes }) => ({
    container: {
        justifyContent: 'center',
        gap: 6,
    },
    bubbleButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: sizes.borderRadius.sm,
        backgroundColor: colors.buttonSecondary.background,
        color: colors.text.highlight,
        overflow: 'hidden',
        textAlign: 'center',
    },
    bubbleActive: {
        backgroundColor: colors.navigation.active,
        color: colors.text.inverted,
    },
}));
