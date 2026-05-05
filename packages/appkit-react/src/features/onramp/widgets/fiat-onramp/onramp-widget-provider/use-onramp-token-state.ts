/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from 'react';
import { validateNumericString } from '@ton/appkit';

import { ONRAMP_CURRENCIES } from '../../../mock-data/currencies';
import type { AmountInputMode, OnrampCurrency } from '../../../types';
import type { AppkitUIToken } from '../../../../../types/appkit-ui-token';

interface UseOnrampTokenStateOptions {
    tokens: AppkitUIToken[];
    defaultTokenId?: string;
    defaultCurrencyId?: string;
}

const FIAT_DECIMALS = 2;

const pickToken = (tokens: AppkitUIToken[], defaultId?: string): AppkitUIToken | null =>
    tokens.find((t) => t.id === defaultId) ?? tokens[0] ?? null;

const pickCurrency = (defaultId?: string): OnrampCurrency =>
    ONRAMP_CURRENCIES.find((c) => c.id === defaultId) ?? ONRAMP_CURRENCIES[0]!;

export const useOnrampTokenState = ({ tokens, defaultTokenId, defaultCurrencyId }: UseOnrampTokenStateOptions) => {
    const [selectedToken, setSelectedToken] = useState<AppkitUIToken | null>(() => pickToken(tokens, defaultTokenId));
    const [selectedCurrency, setSelectedCurrency] = useState<OnrampCurrency>(() => pickCurrency(defaultCurrencyId));
    const [amount, setAmountRaw] = useState('');
    const [amountInputMode, setAmountInputMode] = useState<AmountInputMode>('currency');

    const amountDecimals = amountInputMode === 'token' ? (selectedToken?.decimals ?? 0) : FIAT_DECIMALS;

    const setAmount = useCallback(
        (value: string) => {
            if (value === '' || validateNumericString(value, amountDecimals)) setAmountRaw(value);
        },
        [amountDecimals],
    );

    return {
        selectedToken,
        setSelectedToken,
        selectedCurrency,
        setSelectedCurrency,
        amount,
        setAmount,
        amountInputMode,
        setAmountInputMode,
        amountDecimals,
    };
};
