/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC } from 'react';
import { formatUnits, parseUnits } from '@ton/appkit';
import { Transaction, useSwapQuote, useNetwork, useAddress, useBuildSwapTransaction } from '@ton/appkit-ui-react';

export const USDT_ADDRESS = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

export const SwapButton: FC = () => {
    const network = useNetwork();
    const address = useAddress();
    const {
        data: quote,
        isError,
        isLoading,
    } = useSwapQuote({
        amount: parseUnits('1', 9).toString(),
        fromToken: { type: 'ton' },
        toToken: { type: 'jetton', value: USDT_ADDRESS },
        network,
    });

    const { mutateAsync: buildSwapTransaction } = useBuildSwapTransaction();

    const handleBuildSwapTransaction = () => {
        if (!quote || !address) {
            return Promise.reject(new Error('Missing quote or address'));
        }

        return buildSwapTransaction({
            quote,
            userAddress: address,
        });
    };

    const buttonText = useMemo(() => {
        if (isLoading) {
            return 'Fetching quote...';
        }

        if (isError || !quote) {
            return 'Swap Unavailable';
        }

        return `Swap ${formatUnits(quote.fromAmount, 9)} TON -> ${formatUnits(quote.toAmount, 6)} USDT`;
    }, [isLoading, isError, quote]);

    return (
        <Transaction
            getTransactionRequest={handleBuildSwapTransaction}
            disabled={!quote || isLoading || isError}
            text={buttonText}
        />
    );
};
