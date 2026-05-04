/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from 'react';
import { validateNumericString } from '@ton/appkit';

import { CRYPTO_PAYMENT_METHODS } from '../../../mock-data/crypto-payment-methods';
import type { CryptoOnrampToken, CryptoPaymentMethod } from '../../../types';
import type { CryptoAmountInputMode } from './crypto-onramp-context';

interface UseCryptoOnrampTokenStateOptions {
    tokens: CryptoOnrampToken[];
    paymentMethods: CryptoPaymentMethod[];
    defaultTokenId?: string;
    defaultMethodId?: string;
}

const pickToken = (tokens: CryptoOnrampToken[], defaultId?: string): CryptoOnrampToken | null =>
    tokens.find((t) => t.id === defaultId) ?? tokens[0] ?? null;

const pickMethod = (methods: CryptoPaymentMethod[], defaultId?: string): CryptoPaymentMethod =>
    methods.find((m) => m.id === defaultId) ?? methods[0] ?? CRYPTO_PAYMENT_METHODS[0]!;

export const useCryptoOnrampTokenState = ({
    tokens,
    paymentMethods,
    defaultTokenId,
    defaultMethodId,
}: UseCryptoOnrampTokenStateOptions) => {
    const [selectedToken, setSelectedToken] = useState<CryptoOnrampToken | null>(() =>
        pickToken(tokens, defaultTokenId),
    );
    const [selectedMethod, setSelectedMethod] = useState<CryptoPaymentMethod>(() =>
        pickMethod(paymentMethods, defaultMethodId),
    );
    const [amount, setAmountRaw] = useState('');
    const [amountInputMode, setAmountInputMode] = useState<CryptoAmountInputMode>('method');

    const amountDecimals = amountInputMode === 'method' ? selectedMethod.decimals : (selectedToken?.decimals ?? 0);

    const setAmount = useCallback(
        (value: string) => {
            if (value === '' || validateNumericString(value, amountDecimals)) setAmountRaw(value);
        },
        [amountDecimals],
    );

    return {
        selectedToken,
        setSelectedToken,
        selectedMethod,
        setSelectedMethod,
        amount,
        setAmount,
        amountInputMode,
        setAmountInputMode,
        amountDecimals,
    };
};
