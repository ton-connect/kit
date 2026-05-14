/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

import type { NFT } from '@ton/appkit';
import { NftItem } from '@ton/appkit-react';

const sampleNft: NFT = {
    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    info: { name: 'TON Diamond #42' },
    collection: { address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', name: 'TON Diamonds' },
};

export const NftItemExample = () => {
    // SAMPLE_START: NFT_ITEM
    return <NftItem nft={sampleNft} onClick={() => console.log('NFT clicked')} />;
    // SAMPLE_END: NFT_ITEM
};
