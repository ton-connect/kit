/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '@ton/appkit';
import { useBuildSwapTransaction, useSendTransaction, useSwapQuote } from '@ton/appkit-react';

/* eslint-disable no-console */

export const UseBuildSwapTransactionExample = () => {
    // SAMPLE_START: USE_BUILD_SWAP_TRANSACTION
    // First, get a quote
    const { data: quote } = useSwapQuote({
        from: { address: 'ton', decimals: 9 },
        to: { address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', decimals: 6 },
        amount: '1000000000', // 1 TON in nanotons (raw format)
        network: Network.mainnet(),
    });

    // Valid only for building the transaction
    const { mutateAsync: buildTx, isPending: isBuilding } = useBuildSwapTransaction();

    // Valid for sending the transaction
    const { mutateAsync: sendTx, isPending: isSending } = useSendTransaction();

    const handleSwap = async () => {
        if (!quote) {
            return;
        }

        try {
            // Build the transaction
            const transaction = await buildTx({
                quote,
                userAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // User's wallet address
                slippageBps: 100, // 1%
            });

            // Send the transaction
            await sendTx(transaction);
        } catch (e) {
            console.error(e);
        }
    };

    const isPending = isBuilding || isSending;

    return (
        <div>
            <button onClick={handleSwap} disabled={!quote || isPending}>
                {isPending ? 'Processing...' : 'Swap'}
            </button>
        </div>
    );
    // SAMPLE_END: USE_BUILD_SWAP_TRANSACTION
};
