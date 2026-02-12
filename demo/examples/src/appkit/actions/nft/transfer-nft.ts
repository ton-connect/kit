/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { transferNft } from '@ton/appkit';

export const transferNftExample = async (appKit: AppKit) => {
    // SAMPLE_START: TRANSFER_NFT
    const result = await transferNft(appKit, {
        nftAddress: 'EQCA14o1-VWhS29szfbpmbu_m7A_9S4m_Ba6sAyALH_mU68j',
        recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    });

    console.log('NFT Transfer Result:', result);
    // SAMPLE_END: TRANSFER_NFT
};
