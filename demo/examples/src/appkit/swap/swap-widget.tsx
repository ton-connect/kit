/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '@ton/appkit';
import { SwapWidget } from '@ton/appkit-react';

const tokens = [
    {
        address: 'ton',
        symbol: 'TON',
        name: 'Toncoin',
        decimals: 9,
        network: Network.mainnet(),
        logo: 'https://ton.org/symbol.png',
    },
    {
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        symbol: 'USDT',
        name: 'Tether',
        decimals: 6,
        network: Network.mainnet(),
        logo: 'https://tether.to/logo.png',
    },
];

export const SwapWidgetExample = () => {
    // SAMPLE_START: SWAP_WIDGET
    return <SwapWidget tokens={tokens} network={Network.mainnet()} defaultFromSymbol="TON" defaultToSymbol="USDT" />;
    // SAMPLE_END: SWAP_WIDGET
};

export const SwapWidgetDefaultExample = () => {
    // SAMPLE_START: SWAP_WIDGET_DEFAULT
    return <SwapWidget tokens={tokens} network={Network.mainnet()} />;
    // SAMPLE_END: SWAP_WIDGET_DEFAULT
};

export const SwapWidgetCustomExample = () => {
    // SAMPLE_START: SWAP_WIDGET_CUSTOM
    return (
        <SwapWidget tokens={tokens} network={Network.mainnet()}>
            {({ fromAmount, setFromAmount, toAmount, isQuoteLoading, sendSwapTransaction, canSubmit }) => (
                <div className="custom-swap-ui">
                    <input value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} placeholder="Sell" />

                    <div>{isQuoteLoading ? 'Calculating...' : `Receive: ${toAmount}`}</div>

                    <button disabled={!canSubmit || isQuoteLoading} onClick={sendSwapTransaction}>
                        Swap Now
                    </button>
                </div>
            )}
        </SwapWidget>
    );
    // SAMPLE_END: SWAP_WIDGET_CUSTOM
};
