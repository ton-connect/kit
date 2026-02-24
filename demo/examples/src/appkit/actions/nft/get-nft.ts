/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getNft } from '@ton/appkit';

export const getNftExample = async (appKit: AppKit) => {
    // SAMPLE_START: GET_NFT
    const nft = await getNft(appKit, {
        address: 'EQCA14o1-VWhS29szfbpmbu_m7A_9S4m_Ba6sAyALH_mU68j',
    });

    if (nft) {
        console.log('NFT Name:', nft.info?.name);
        console.log('NFT Collection:', nft.collection?.name);
    }
    // SAMPLE_END: GET_NFT
};
