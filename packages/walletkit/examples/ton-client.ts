/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// npx ts-node examples/ton-client.ts
import 'dotenv/config';
import util from 'util';

import { ApiClientToncenter, ConnectTransactionParamMessage, CHAIN, Signer, WalletV5R1Adapter } from '../src';

// eslint-disable-next-line no-console
const logInfo = console.log;
// eslint-disable-next-line no-console
const logError = console.error;

const isTestSend = process.env.TEST_SEND;
const networkName = process.env.TON_NETWORK ?? 'TESTNET';
const network = CHAIN[networkName as keyof typeof CHAIN];
const apiKey = process.env[`TON_API_KEY_${networkName}`];
const mnemonic = process.env[`TON_MNEMONIC_${networkName}`]!.trim().split(' ');
const client = new ApiClientToncenter({ apiKey, network });

async function logWallet(wallet: WalletV5R1Adapter) {
    return {
        address: wallet.getAddress(),
        balance: await wallet.getBalance(),
    };
}

async function main() {
    const signer = await Signer.fromMnemonic(mnemonic);
    const existAccount = await WalletV5R1Adapter.create(signer, { client, network });
    logInfo('exist account', util.inspect(await logWallet(existAccount), { colors: true, depth: 6 }));
    const message: ConnectTransactionParamMessage = {
        address: existAccount.getAddress(),
        amount: '1',
    };
    const emulation = await client.fetchEmulation(existAccount.getAddress(), [message]);
    logInfo(
        'emulation total fees',
        Object.values(emulation.transactions)
            .map((it) => it.total_fees)
            .reduce((acc, cnt) => acc + +cnt, 0),
    );
    if (isTestSend) {
        const boc = await existAccount.getSignedSendTransaction(
            {
                network: CHAIN.MAINNET,
                valid_until: Math.floor(Date.now() / 1000) + 60,
                messages: [message],
            },
            { fakeSignature: false },
        );
        const hash = await client.sendBoc(boc);
        logInfo('send boc hash:', hash);
    }
}

main().catch((error) => {
    if (error instanceof Error) {
        logError(error.message);
        logError(error.stack);
    } else {
        logError('Unknown error:', error);
    }
    process.exit(1);
});
