/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getNftsByAddress } from '@ton/appkit';

export const getNftsByAddressExample = async (appKit: AppKit) => {
    // SAMPLE_START: GET_NFTS_BY_ADDRESS
    const response = await getNftsByAddress(appKit, {
        address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // Zero Address
    });

    console.log('NFTs by address:', response.nfts.length);
    // SAMPLE_END: GET_NFTS_BY_ADDRESS
};
