/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';

import { CurrencyItem } from '../../../../components/shared/currency-item';
import type { OnrampCurrency } from '../../types';

/**
 * Props for `OnrampCurrencyItem` — extends the `CurrencyItem.Container` props (e.g. `onClick`, `className`) with the currency to render. Internal: TonPay / fiat onramp are not part of the public API yet.
 */
export interface OnrampCurrencyItemProps extends ComponentProps<typeof CurrencyItem.Container> {
    /** Fiat currency to render — logo, name and ticker code are taken from `OnrampCurrency`. */
    currency: OnrampCurrency;
}

/**
 * Row component rendering a single `OnrampCurrency` (logo, name, ticker code) as a clickable item — used inside `OnrampCurrencySelectModal`. Internal: TonPay / fiat onramp are not part of the public API yet.
 */
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
