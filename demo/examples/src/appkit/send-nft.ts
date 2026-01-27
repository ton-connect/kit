/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFTTransferRequest, Wallet } from '@ton/walletkit';

// SAMPLE_START: APPKIT_SEND_NFT
async function sendNft(wallet: Wallet) {
    const nftTransfer: NFTTransferRequest = {
        nftAddress: 'EQD...nft-item...',
        recipientAddress: 'EQC...recipient...',
        comment: 'Sending NFT',
    };

    // Build the transaction
    const transaction = await wallet.createTransferNftTransaction(nftTransfer);

    // Sign and send via TonConnect
    const result = await wallet.sendTransaction(transaction);
    console.log('NFT transfer sent:', result.boc);
}
// SAMPLE_END: APPKIT_SEND_NFT

export { sendNft };
