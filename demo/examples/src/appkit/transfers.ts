/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { transferTon, transferJetton, transferNft, sendTransaction } from '@ton/appkit';
import { beginCell } from '@ton/core';
import type { Base64String } from '@ton/walletkit';

export const transferTonExample = async (appKit: AppKit) => {
    // Simple transfer
    await transferTon(appKit, {
        recipientAddress: 'UQ...',
        amount: '1.5', // 1.5 TON
        comment: 'Hello from AppKit',
    });
};

export const transferJettonExample = async (appKit: AppKit) => {
    await transferJetton(appKit, {
        jettonAddress: 'EQ...',
        recipientAddress: 'UQ...',
        amount: '100', // 100 Jettons
        comment: 'Gift',
    });
};

export const transferNftExample = async (appKit: AppKit) => {
    await transferNft(appKit, {
        nftAddress: 'EQ...',
        recipientAddress: 'UQ...',
        comment: 'My NFT',
    });
};

export const rawTransactionExample = async (appKit: AppKit) => {
    // Send a raw transaction with a custom payload
    await sendTransaction(appKit, {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
            {
                address: 'UQ...',
                amount: '0.1',
                payload: beginCell()
                    .storeUint(0, 32)
                    .storeStringTail('Custom payload')
                    .endCell()
                    .toBoc()
                    .toString('base64') as Base64String,
            },
        ],
    });
};
