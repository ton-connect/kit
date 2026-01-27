/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Wallet } from '@ton/walletkit';

// SAMPLE_START: APPKIT_FETCH_JETTONS
async function fetchJettons(wallet: Wallet) {
    // Fetch jetton balances
    const response = await wallet.getJettons({
        pagination: { offset: 0, limit: 50 },
    });

    // response.jettons is an array of Jetton objects
    for (const jetton of response.jettons) {
        console.log(`${jetton.info.name}: ${jetton.balance}`);
    }

    return response.jettons;
}
// SAMPLE_END: APPKIT_FETCH_JETTONS

// SAMPLE_START: APPKIT_FETCH_NFTS
async function fetchNfts(wallet: Wallet) {
    // Fetch owned NFTs
    const response = await wallet.getNfts({
        pagination: { offset: 0, limit: 50 },
    });

    // response.nfts is an array of NFT objects
    for (const nft of response.nfts) {
        console.log(`NFT: ${nft.info?.name ?? nft.address}`);
    }

    return response.nfts;
}
// SAMPLE_END: APPKIT_FETCH_NFTS

export { fetchJettons, fetchNfts };
