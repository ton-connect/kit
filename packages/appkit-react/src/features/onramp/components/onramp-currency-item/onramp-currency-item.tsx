/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';

import { CurrencyItem } from '../../../../components/currency-item';
import type { OnrampCurrency } from '../../types';

export interface OnrampCurrencyItemProps extends ComponentProps<typeof CurrencyItem.Container> {
    currency: OnrampCurrency;
}

export const OnrampCurrencyItem: FC<OnrampCurrencyItemProps> = ({ currency, ...props }) => {
    return (
        <CurrencyItem.Container {...props}>
            <CurrencyItem.Logo src={currency.logo} fallback={currency.code[0]} alt={currency.code} />
            <CurrencyItem.Info>
                <CurrencyItem.Header>
                    <CurrencyItem.Name>{currency.name}</CurrencyItem.Name>
                </CurrencyItem.Header>

                <CurrencyItem.Ticker>{currency.code}</CurrencyItem.Ticker>
            </CurrencyItem.Info>
        </CurrencyItem.Container>
    );
};
