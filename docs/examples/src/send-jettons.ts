/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import 'dotenv/config';

// SAMPLE_START: SEND_JETTONS_1
import type { JettonsTransferRequest } from '@ton/walletkit';
// SAMPLE_END: SEND_JETTONS_1

import { walletKitInitializeSample, getSelectedWalletAddress } from './lib/wallet-kit-initialize-sample';

export async function main() {
    const kit = await walletKitInitializeSample();
    // SAMPLE_START: SEND_JETTONS_2
    const wallet = kit.getWallet(getSelectedWalletAddress());
    if (!wallet) throw new Error('No wallet');

    const jettonTransfer: JettonsTransferRequest = {
        recipientAddress: 'EQC...recipient...',
        jettonAddress: 'EQD...jetton-master...',
        transferAmount: '1000000000', // raw amount per token decimals
        comment: 'Payment',
    };

    const tx = await wallet.createTransferJettonTransaction(jettonTransfer);
    await kit.handleNewTransaction(wallet, tx);
    // SAMPLE_END: SEND_JETTONS_2

    // SAMPLE_START: FETCHING_NFTS
    const items = await wallet.getNfts({ pagination: { offset: 0, limit: 50 } });
    // items.items is an array of NftItem
    console.log(`✓ Fetched ${items?.nfts?.length ?? 0} NFTs`);
    // SAMPLE_END: FETCHING_NFTS
}

/* istanbul ignore next */
if (process.env.VITEST !== 'true') {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
