/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getNftsByAddress } from '@ton/appkit';

export const nftExample = async (appKit: AppKit) => {
    // Get NFTs of a specific address
    const nfts = await getNftsByAddress(appKit, { address: 'UQ...' });
    console.log('My NFTs:', nfts);
};
