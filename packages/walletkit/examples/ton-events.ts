/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// npx ts-node examples/ton-events.ts
import 'dotenv/config';
import { replacer } from '@ton-community/tlb-runtime';

import { ApiClientToncenter, CHAIN, WalletV5R1Adapter, Signer } from '../src';

// eslint-disable-next-line no-console
const logInfo = console.log;
// eslint-disable-next-line no-console
const logError = console.error;

const networkName = process.env.TON_NETWORK ?? 'TESTNET';
const network = CHAIN[networkName as keyof typeof CHAIN];
const apiKey = process.env[`TON_API_KEY_${networkName}`];
const mnemonic = process.env[`TON_MNEMONIC_${networkName}`]!.trim().split(' ');
const client = new ApiClientToncenter({ apiKey, network });

async function main() {
    const signer = await Signer.fromMnemonic(mnemonic);
    const wallet = await WalletV5R1Adapter.create(signer, { client, network });
    const account = wallet.getAddress();
    logInfo(account);
    const list = await client.getEvents({ account });
    logInfo(JSON.stringify(list, replacer, 2));
    logInfo(await client.getEvents({ account, offset: 1 }));
    logInfo(list.events[0]);
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
