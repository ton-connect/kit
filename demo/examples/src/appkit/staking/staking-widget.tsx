/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '@ton/appkit';
import { StakingWidget } from '@ton/appkit-react';

export const StakingWidgetExample = () => {
    // SAMPLE_START: STAKING_WIDGET
    return <StakingWidget network={Network.mainnet()} className="my-custom-widget" />;
    // SAMPLE_END: STAKING_WIDGET
};

export const StakingWidgetCustomExample = () => {
    // SAMPLE_START: STAKING_WIDGET_CUSTOM
    return (
        <StakingWidget network={Network.mainnet()}>
            {({ amount, setAmount, sendTransaction, quote, isQuoteLoading, canSubmit }) => (
                <div className="custom-staking-ui">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Amount to stake"
                    />

                    {isQuoteLoading ? (
                        <p>Fetching quote...</p>
                    ) : quote ? (
                        <p>You will receive: {quote.amountOut}</p>
                    ) : null}

                    <button disabled={!canSubmit || isQuoteLoading} onClick={() => sendTransaction()}>
                        Stake TON
                    </button>
                </div>
            )}
        </StakingWidget>
    );
    // SAMPLE_END: STAKING_WIDGET_CUSTOM
};
