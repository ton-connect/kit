/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getNfts } from '@ton/appkit';

export const getNftsExample = async (appKit: AppKit) => {
    // SAMPLE_START: GET_NFTS
    const response = await getNfts(appKit);

    if (response) {
        console.log('Total NFTs:', response.nfts.length);
        response.nfts.forEach((nft) => console.log(`- ${nft.info?.name}`));
    }
    // SAMPLE_END: GET_NFTS
};
