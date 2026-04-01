/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC } from 'react';
import {
    Transaction,
    UnstakeMode,
    useStakingQuote,
    useNetwork,
    useAddress,
    useBuildStakeTransaction,
} from '@ton/appkit-react';
import type { UnstakeModes } from '@ton/appkit-react';

interface StakeButtonProps {
    amount: string;
    direction: 'stake' | 'unstake';
    providerId?: string;
    /** When false, quote fetching is disabled (e.g. invalid custom amount). */
    quoteEnabled?: boolean;
    /** Used when `direction` is `unstake`; defaults to instant. */
    unstakeMode?: UnstakeModes;
    className?: string;
}

export const StakeButton: FC<StakeButtonProps> = ({
    amount,
    direction,
    providerId,
    quoteEnabled = true,
    unstakeMode = UnstakeMode.INSTANT,
    className = undefined,
}) => {
    const network = useNetwork();
    const address = useAddress();

    const {
        data: quote,
        isError,
        isLoading,
    } = useStakingQuote({
        amount,
        direction,
        network,
        providerId,
        ...(direction === 'unstake' ? { unstakeMode } : {}),
        query: { enabled: quoteEnabled },
    });

    const { mutateAsync: buildStakeTransaction } = useBuildStakeTransaction();

    const handleTransaction = () => {
        if (!quote || !address) {
            return Promise.reject(new Error('Missing quote or address'));
        }

        return buildStakeTransaction({
            quote,
            userAddress: address,
        });
    };

    const buttonText = useMemo(() => {
        if (isLoading) {
            return 'Fetching quote...';
        }

        if (isError || !quote) {
            return 'Staking Unavailable';
        }

        const action = direction === 'stake' ? 'Stake' : 'Unstake';
        return `${action} ${quote.amountIn} ${direction === 'stake' ? 'TON' : 'tsTON'} -> ${quote.amountOut} ${direction === 'stake' ? 'tsTON' : 'TON'}`;
    }, [isLoading, isError, quote, direction]);

    return (
        <Transaction
            request={handleTransaction}
            disabled={!quoteEnabled || !quote || isLoading || isError}
            text={buttonText}
            className={className}
        />
    );
};
