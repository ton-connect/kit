/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useBuildStakeTransaction, useSendTransaction, useStakingQuote } from '@ton/appkit-react';

/* eslint-disable no-console */

export const UseBuildStakeTransactionExample = () => {
    // SAMPLE_START: USE_BUILD_STAKE_TRANSACTION
    const { data: quote } = useStakingQuote({
        amount: '10',
        direction: 'stake',
    });

    const { mutateAsync: buildTx, isPending: isBuilding } = useBuildStakeTransaction();
    const { mutateAsync: sendTx, isPending: isSending } = useSendTransaction();

    const handleStake = async () => {
        if (!quote) return;
        try {
            const transaction = await buildTx({
                quote,
                userAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            });
            await sendTx(transaction);
        } catch (e) {
            console.error(e);
        }
    };

    const isPending = isBuilding || isSending;

    return (
        <div>
            <button onClick={handleStake} disabled={!quote || isPending}>
                {isPending ? 'Processing...' : 'Stake'}
            </button>
        </div>
    );
    // SAMPLE_END: USE_BUILD_STAKE_TRANSACTION
};
