/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type FC, useMemo } from 'react';
import type { TextStyle } from 'react-native';

import { useFormattedAmount } from '../../hooks/use-formatted-amount';
import { Big } from '../../libs/big-number';
import { AppText, type AppTextProps } from '../app-text';

export interface TextAmountProps extends AppTextProps {
    amount: string;
    decimals?: number;
    tokenCode?: string;
    isSymbolShown?: boolean;
    isDecimalsFixed?: boolean;
    hideIfLessThanCent?: boolean;
    isFiat?: boolean;
    symbol?: string;
}

export const TextAmount: FC<TextAmountProps> = ({
    amount,
    tokenCode,
    isSymbolShown,
    style,
    decimals: initialDecimals,
    isDecimalsFixed,
    hideIfLessThanCent,
    isFiat,
    symbol = '$',
    ...props
}) => {
    const decimals = useMemo(() => {
        if (initialDecimals || initialDecimals === 0) return initialDecimals < 6 ? initialDecimals : 6;

        if (isFiat) return;

        return initialDecimals || 6;
    }, [initialDecimals, isFiat]);

    const isLoser = useMemo(() => Big(amount).lt(0), [amount]);
    const absAmount = useMemo(() => Big(amount).abs().toString(), [amount]);
    const isLessThanCent = useMemo(() => {
        if (!hideIfLessThanCent) return false;

        return Big(amount).lte(0.01) && Big(amount).gt(0);
    }, [amount, hideIfLessThanCent]);
    const formattedBalance = useFormattedAmount(absAmount, {
        isDecimalsFixed,
        decimals,
        isFiatToken: isFiat,
    });

    const showIcon = isSymbolShown;
    const showTokenCode = !!tokenCode;

    return (
        <AppText style={style as TextStyle} {...props}>
            {isLoser && '-'}
            {isLessThanCent && '<'}
            {showIcon && symbol}
            {!isLessThanCent && formattedBalance}
            {isLessThanCent && 0.01}
            {showTokenCode && <> {tokenCode}</>}
        </AppText>
    );
};
