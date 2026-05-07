/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import 'dotenv/config';

// SAMPLE_START: SEND_NFTS_1
import type { NFTTransferRequest } from '@ton/walletkit';
// SAMPLE_END: SEND_NFTS_1

import { walletKitInitializeSample, getSelectedWalletAddress } from './lib/wallet-kit-initialize-sample';

export async function main() {
    const kit = await walletKitInitializeSample();
    // SAMPLE_START: SEND_NFTS_2
    const wallet = kit.getWallet(getSelectedWalletAddress());
    if (!wallet) throw new Error('No wallet');

    const nftTransfer: NFTTransferRequest = {
        nftAddress: 'EQD...nft-item...',
        recipientAddress: 'EQC...recipient...',
        transferAmount: '1', // TON used to invoke NFT transfer (nanotons)
        comment: 'Gift',
    };

    const tx = await wallet.createTransferNftTransaction(nftTransfer);
    await kit.handleNewTransaction(wallet, tx);
    // SAMPLE_END: SEND_NFTS_2
}

/* istanbul ignore next */
if (process.env.VITEST !== 'true') {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
