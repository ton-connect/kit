/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { transferNft } from '@ton/appkit';

// SAMPLE_START: APPKIT_SEND_NFT
async function sendNft(appKit: AppKit) {
    // Send NFT using appkit action
    const result = await transferNft(appKit, {
        nftAddress: 'EQD...nft-item...',
        recipientAddress: 'EQC...recipient...',
        comment: 'Sending NFT',
    });

    console.log('NFT transfer sent:', result.boc);
}
// SAMPLE_END: APPKIT_SEND_NFT

export { sendNft };
