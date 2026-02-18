/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC } from 'react';
import { Transaction, useSwapQuote, useNetwork, useAddress, useBuildSwapTransaction } from '@ton/appkit-react';

const USDT_ADDRESS = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
const TON = { address: 'ton', decimals: 9, symbol: 'TON' };
const USDT = { address: USDT_ADDRESS, decimals: 6, symbol: 'USDT' };

export const SwapButton: FC = () => {
    const network = useNetwork();
    const address = useAddress();

    const from = TON;
    const to = USDT;
    const {
        data: quote,
        isError,
        isLoading,
    } = useSwapQuote({
        amount: '1',
        from,
        to,
        network,
        slippageBps: 100,
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

        return `Swap ${quote.fromAmount} ${from.symbol} -> ${quote.toAmount} ${to.symbol}`;
    }, [isLoading, isError, quote]);

    return (
        <Transaction request={handleBuildSwapTransaction} disabled={!quote || isLoading || isError} text={buttonText} />
    );
};
