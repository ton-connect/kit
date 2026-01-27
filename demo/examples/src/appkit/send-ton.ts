/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TONTransferRequest, Wallet } from '@ton/walletkit';

// SAMPLE_START: APPKIT_SEND_TON
async function sendTon(wallet: Wallet) {
    const tonTransfer: TONTransferRequest = {
        recipientAddress: 'EQC...recipient...',
        transferAmount: (1n * 10n ** 9n).toString(), // 1 TON in nanotons
        comment: 'Payment for services',
    };

    // Build the transaction
    const transaction = await wallet.createTransferTonTransaction(tonTransfer);

    // Sign and send via TonConnect
    const result = await wallet.sendTransaction(transaction);
    console.log('Transaction sent:', result.boc);
}
// SAMPLE_END: APPKIT_SEND_TON

export { sendTon };
