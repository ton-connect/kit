/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import 'dotenv/config';
import type { TonTransferParams, JettonTransferParams, NftTransferParamsHuman } from '@ton/walletkit';

import { walletKitInitializeSample } from './lib/walletKitInitializeSample';

/**
 * npx tsx src/sending-assets.ts
 *
 * Example script that demonstrates how to send assets programmatically:
 * 1. Send TON
 * 2. Send Jettons (fungible tokens)
 * 3. Send NFTs
 * 4. Fetch NFTs
 */

// Example code snippets for documentation (not executed)
// These examples assume kit and getSelectedWalletAddress() are available in your code

// SAMPLE_START: SEND_TON
// import type { TonTransferParams } from '@ton/walletkit';
//
// const from = kit.getWallet(getSelectedWalletAddress());
// if (!from) throw new Error('No wallet');
//
// const tonTransfer: TonTransferParams = {
//     toAddress: 'EQC...recipient...',
//     amount: (1n * 10n ** 9n).toString(), // 1 TON in nanotons
//     // Optional comment OR body (base64 BOC), not both
//     comment: 'Thanks!',
// };
//
// // 1) Build transaction content
// const tx = await from.createTransferTonTransaction(tonTransfer);
//
// // 2) Route into the normal flow (triggers onTransactionRequest)
// await kit.handleNewTransaction(from, tx);
// SAMPLE_END: SEND_TON

// SAMPLE_START: SEND_JETTONS
// import type { JettonTransferParams } from '@ton/walletkit';
//
// const wallet = kit.getWallet(getSelectedWalletAddress());
// if (!wallet) throw new Error('No wallet');
//
// const jettonTransfer: JettonTransferParams = {
//     toAddress: 'EQC...recipient...',
//     jettonAddress: 'EQD...jetton-master...',
//     amount: '1000000000', // raw amount per token decimals
//     comment: 'Payment',
// };
//
// const tx = await wallet.createTransferJettonTransaction(jettonTransfer);
// await kit.handleNewTransaction(wallet, tx);
// SAMPLE_END: SEND_JETTONS

// SAMPLE_START: SEND_NFTS
// import type { NftTransferParamsHuman } from '@ton/walletkit';
//
// const wallet = kit.getWallet(getSelectedWalletAddress());
// if (!wallet) throw new Error('No wallet');
//
// const nftTransfer: NftTransferParamsHuman = {
//     nftAddress: 'EQD...nft-item...',
//     toAddress: 'EQC...recipient...',
//     transferAmount: 10000000n, // TON used to invoke NFT transfer (nanotons)
//     comment: 'Gift',
// };
//
// const tx = await wallet.createTransferNftTransaction(nftTransfer);
// await kit.handleNewTransaction(wallet, tx);
// SAMPLE_END: SEND_NFTS

async function main() {
    console.log('=== Sending Assets Examples ===');
    const kit = await walletKitInitializeSample();

    // For demo purposes, we select the last wallet in the list
    function getSelectedWalletId() {
        return kit.getWallets().pop()?.getWalletId() ?? '';
    }

    const wallet = kit.getWallet(getSelectedWalletId());
    if (!wallet) {
        console.error('No wallet available');
        await kit.close();
        return;
    }

    // SAMPLE_START: FETCHING_NFTS
    const items = await wallet.getNfts({ pagination: { offset: 0, limit: 50 } });
    // items.nfts is an array of NftItem
    console.log(`✓ Fetched ${items?.nfts?.length ?? 0} NFTs`);
    // SAMPLE_END: FETCHING_NFTS

    await kit.close();
    console.log('✓ Sending assets examples completed');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
