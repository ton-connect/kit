/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Big } from '../../libs/big-number';
import { AppInput } from '../app-input';
import type { AppInputProps } from '../app-input';
import { AppText } from '../app-text';

import { Row } from '@/core/components/grid';

export interface Props extends Omit<AppInputProps, 'style'> {
    amount: string;
    onChangeAmount: (amount: string) => void;
    ticker: string;
    style?: ViewStyle;
}

export const InputWithTicker: FC<Props> = ({ amount, onChangeAmount, ticker, style, ...props }) => {
    const handleBlur = (): void => {
        if (Big(amount).lte(0)) onChangeAmount('0');
    };

    return (
        <Row style={[styles.container, style]}>
            <AppInput
                inputMode="numeric"
                keyboardType="numeric"
                onBlur={handleBlur}
                onChangeText={onChangeAmount}
                placeholder="100"
                style={styles.input}
                textAlign="center"
                textType="h3"
                value={amount}
                {...props}
            />

            <AppText style={styles.ticker} textType="h4">
                {ticker}
            </AppText>
        </Row>
    );
};

const styles = StyleSheet.create(({ colors }) => ({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    input: {
        minWidth: 40,
        textAlign: 'center',
        color: colors.text.highlight,
        marginRight: 5,
    },
    ticker: {
        color: colors.text.secondary,
    },
}));
