/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JettonsTransferRequest, Wallet } from '@ton/walletkit';

// SAMPLE_START: APPKIT_SEND_JETTONS
async function sendJettons(wallet: Wallet) {
    const jettonTransfer: JettonsTransferRequest = {
        recipientAddress: 'EQC...recipient...',
        jettonAddress: 'EQD...jetton-master...',
        transferAmount: '1000000000', // raw amount per token decimals
        comment: 'Jetton payment',
    };

    // Build the transaction
    const transaction = await wallet.createTransferJettonTransaction(jettonTransfer);

    // Sign and send via TonConnect
    const result = await wallet.sendTransaction(transaction);
    console.log('Jetton transfer sent:', result.boc);
}
// SAMPLE_END: APPKIT_SEND_JETTONS

export { sendJettons };
