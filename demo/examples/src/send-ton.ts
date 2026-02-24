/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import 'dotenv/config';

// SAMPLE_START: SEND_TON_1
import type { TONTransferRequest } from '@ton/walletkit';
// SAMPLE_END: SEND_TON_1

import { walletKitInitializeSample, getSelectedWalletAddress } from './lib/wallet-kit-initialize-sample';

export async function main() {
    const kit = await walletKitInitializeSample();
    // SAMPLE_START: SEND_TON_2
    const from = await kit.getWallet(await getSelectedWalletAddress());
    if (!from) throw new Error('No wallet');

    const tonTransfer: TONTransferRequest = {
        recipientAddress: 'EQC...recipient...',
        transferAmount: (1n * 10n ** 9n).toString(), // 1 TON in nanotons
        // Optional comment OR body (base64 BOC), not both
        comment: 'Thanks!',
    };

    // 1) Build transaction content
    const tx = await from.createTransferTonTransaction(tonTransfer);

    // 2) Route into the normal flow (triggers onTransactionRequest)
    await kit.handleNewTransaction(from, tx);
    // SAMPLE_END: SEND_TON_2
}

/* istanbul ignore next */
if (process.env.VITEST !== 'true') {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
