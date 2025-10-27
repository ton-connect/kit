/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import util from 'util';

import { Address } from '@ton/core';
import * as dotenv from 'dotenv';

import {
    defaultWalletIdV5R1,
    ApiClientToncenter,
    createWalletInitConfigMnemonic,
    createWalletV5R1,
    ConnectTransactionParamMessage,
    WalletInterface,
    CHAIN,
} from '../src';
import { wrapWalletInterface } from '../src/core/Initializer';
dotenv.config();

// eslint-disable-next-line no-console
const logInfo = console.log;
// eslint-disable-next-line no-console
const logError = console.error;

const isTestSend = process.env.TEST_SEND;
const apiKey = process.env.TONCENTER_API_KEY;
const mnemonic = process.env.MNEMONIC;

const endpoint = 'https://toncenter.com';
const tonClient = new ApiClientToncenter({
    endpoint,
    apiKey,
    network: CHAIN.MAINNET,
});

function nextWalletId(parent?: Address | string): number {
    if (!parent) {
        return defaultWalletIdV5R1;
    }
    if (typeof parent === 'string') {
        parent = Address.parse(parent);
    }
    const slug = parent.hash.toString('hex').slice(0, 8);
    const bytes: string[] = [];
    for (let i = 0; i < 8; i += 2) {
        bytes.push(slug.slice(i, i + 2));
    }
    return parseInt(bytes.reverse().join(''), 16);
}

async function createWallet(parent?: Address | string) {
    return wrapWalletInterface(
        await createWalletV5R1(
            createWalletInitConfigMnemonic({
                mnemonic: mnemonic!.trim().split(' '),
                walletId: BigInt(nextWalletId(parent)),
            }),
            { tonClient },
        ),
        tonClient,
    );
}

async function logWallet(wallet: WalletInterface) {
    return {
        address: wallet.getAddress(),
        nfts: await wallet.getNfts({}),
        balance: await wallet.getBalance(),
    };
}

async function main() {
    const existAccount = await createWallet();
    logInfo('exist account', util.inspect(await logWallet(existAccount), { colors: true, depth: 6 }));
    const notExistAccount = await createWallet(existAccount.getAddress());
    logInfo('not exist account', await logWallet(notExistAccount));
    const message: ConnectTransactionParamMessage = {
        address: existAccount.getAddress(),
        amount: '1',
    };
    const emulation = await tonClient.fetchEmulation(existAccount.getAddress(), [message]);
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
        const hash = await tonClient.sendBoc(boc);
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
