/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { sendTransaction } from '@ton/appkit';
import { Network } from '@ton/walletkit';

export const swapExample = async (appKit: AppKit) => {
    const swapManager = appKit.swapManager;

    // Get a quote for swapping TON to USDT
    const quote = await swapManager.getQuote({
        fromToken: 'TON',
        toToken: 'EQ...', // USDT address
        amountFrom: '1000000000', // 1 TON
        network: Network.mainnet(),
    });

    console.log('Swap Quote:', quote);

    // Build swap transaction
    const tx = await swapManager.buildSwapTransaction({
        quote: quote,
        userAddress: 'UQ...', // User's address
    });

    // Send the transaction
    await sendTransaction(appKit, tx);
};
