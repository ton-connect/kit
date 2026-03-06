/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFT } from '@ton/appkit';

type NftTrust = 'whitelist' | 'graylist' | 'blacklist' | 'none';

function readTrust(nft: NFT): NftTrust | undefined {
    const trust = nft.extra?.trust;
    if (trust === 'none' || trust === 'whitelist' || trust === 'graylist' || trust === 'blacklist') {
        return trust;
    }
    return undefined;
}

export function isAllowedNftTrust(nft: NFT): boolean {
    const trust = readTrust(nft);
    return trust === undefined || trust === 'none' || trust === 'whitelist';
}
