/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '@ton/appkit';
import { SwapInfo } from '@ton/appkit-react';
import type { AppkitUIToken } from '@ton/appkit-react';

const toToken: AppkitUIToken = {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    network: Network.mainnet(),
};

export const SwapInfoExample = () => {
    // SAMPLE_START: SWAP_INFO
    // In the swap widget `quote` and `provider` come from `useSwapContext`; until
    // those resolve the min-received row shows `0 USDT` and the provider row a
    // skeleton placeholder.
    return <SwapInfo toToken={toToken} slippage={100} />;
    // SAMPLE_END: SWAP_INFO
};
