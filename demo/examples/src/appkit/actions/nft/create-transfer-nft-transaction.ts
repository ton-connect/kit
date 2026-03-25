/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { createTransferNftTransaction } from '@ton/appkit';

export const createTransferNftTransactionExample = async (appKit: AppKit) => {
    // SAMPLE_START: CREATE_TRANSFER_NFT_TRANSACTION
    const tx = await createTransferNftTransaction(appKit, {
        nftAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        comment: 'Gift NFT',
    });

    console.log('NFT Transfer Transaction:', tx);
    // SAMPLE_END: CREATE_TRANSFER_NFT_TRANSACTION
};
