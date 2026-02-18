/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC } from 'react';
import { formatUnits } from '@ton/appkit';
import { Transaction, useSwapQuote, useNetwork, useAddress, useBuildSwapTransaction } from '@ton/appkit-react';

export const USDT_ADDRESS = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

export const SwapButton: FC = () => {
    const network = useNetwork();
    const address = useAddress();
    const {
        data: quote,
        isError,
        isLoading,
    } = useSwapQuote({
        amount: '1',
        from: { address: 'ton', decimals: 9 },
        to: { address: USDT_ADDRESS, decimals: 6 },
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

        return `Swap ${formatUnits(quote.fromAmount, 9)} TON -> ${formatUnits(quote.toAmount, 6)} USDT`;
    }, [isLoading, isError, quote]);

    return (
        <Transaction request={handleBuildSwapTransaction} disabled={!quote || isLoading || isError} text={buttonText} />
    );
};
