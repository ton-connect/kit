import { Address } from '@ton/core';

import {
    defaultWalletIdV5R1,
    createWalletV5R1,
    ApiClientToncenter,
    createWalletInitConfigMnemonic,
    WalletV5R1Adapter,
    WalletV5,
    ConnectTransactionParamMessage,
} from '../src';

// eslint-disable-next-line no-console
const logInfo = console.log;
// eslint-disable-next-line no-console
const logError = console.error;

const apiKey = process.env.TONCENTER_API_KEY;
const mnemonic = process.env.MNEMONIC;

const endpoint = 'https://toncenter.com';
const tonClient = new ApiClientToncenter({
    endpoint,
    apiKey,
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
    return createWalletV5R1(
        createWalletInitConfigMnemonic({
            mnemonic: mnemonic!.trim().split(' '),
            walletId: BigInt(nextWalletId(parent)),
        }),
        { tonClient },
    );
}

async function logWallet(wallet: WalletV5) {
    return {
        address: wallet.address,
        publicKey: await wallet.publicKey,
        status: await wallet.status,
        seqno: await wallet.seqno,
        walletId: await wallet.walletId,
        isSignatureAuthAllowed: await wallet.isSignatureAuthAllowed,
        extensions: await wallet.extensions,
    };
}

async function main() {
    const existAccount = await createWallet();
    const wallet = (existAccount as WalletV5R1Adapter).walletContract;
    logInfo('exist account', await logWallet(wallet));
    const notExistAccount = ((await createWallet(wallet.address)) as WalletV5R1Adapter).walletContract;
    logInfo('not exist account', await logWallet(notExistAccount));
    const message: ConnectTransactionParamMessage = {
        address: wallet.address.toString(),
        amount: '1',
    };
    const emulation = await tonClient.fetchEmulation(wallet.address, [message]);
    logInfo(
        'emulation total fees',
        Object.values(emulation.transactions)
            .map((it) => it.total_fees)
            .reduce((acc, cnt) => acc + +cnt, 0),
    );
    const boc = await existAccount.getSignedExternal(
        {
            network: 'mainnet',
            valid_until: Math.floor(Date.now() / 1000) + 60,
            messages: [message],
        },
        { fakeSignature: false },
    );
    const hash = await tonClient.sendBoc(boc);
    logInfo('send boc hash:', hash);
}

main().catch((error) => {
    if (error instanceof Error) {
        logError(error.message);
    } else {
        logError('Unknown error:', error);
    }
    process.exit(1);
});
