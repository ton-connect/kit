/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ApiClientToncenter, CHAIN } from '../src';

// eslint-disable-next-line no-console
const logInfo = console.log;
// eslint-disable-next-line no-console
const logError = console.error;

const networkName = process.env.TON_NETWORK ?? 'TESTNET';
const network = CHAIN[networkName as keyof typeof CHAIN];
const apiKey = process.env[`TON_API_KEY_${networkName}`];
const client = new ApiClientToncenter({ apiKey, network });

async function main() {
    const wallet = await client.resolveDnsWallet('tolya.ton');
    logInfo({ wallet });
    const domain = await client.backResolveDnsWallet(wallet!);
    logInfo({ domain });
}

main().catch((error) => {
    logError(error);
    process.exit(1);
});
