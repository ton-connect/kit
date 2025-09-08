import { Address } from '@ton/core';

import { createWalletV5R1, ApiClient, WalletInitConfigMnemonic } from '../src';

// eslint-disable-next-line no-console
const logInfo = console.log;
// eslint-disable-next-line no-console
const logError = console.error;

const apiKey = process.env.TONCENTER_API_KEY;
const mnemonic = process.env.MNEMONIC;

const endpoint = 'https://toncenter.com';
const tonClient = new ApiClient({
    endpoint,
    apiKey,
});

function nextWalletId(parent?: Address | string) {
    if (!parent) {
        return 2147483409; // TODO use default wallet_id for mainnet 698983191;
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
        new WalletInitConfigMnemonic({
            mnemonic: mnemonic!.trim().split(' '),
            walletId: nextWalletId(parent),
        }),
        { tonClient },
    );
}

async function main() {
    const existAccount = await createWallet();
    logInfo(existAccount.getAddress());
    const notExistAccount = await createWallet(existAccount.getAddress());
    logInfo('Account exist state:', {
        state: await tonClient.getAccountState(existAccount.getAddress()),
    });
    logInfo('Account balance:', {
        balance: await tonClient.getBalance(existAccount.getAddress()),
    });
    const result = await tonClient.runGetMethod(existAccount.getAddress(), 'seqno');
    logInfo('get method seqno:', {
        result: result.stack.readNumber(),
    });
    logInfo('Account not exist state:', {
        state: await tonClient.getAccountState(notExistAccount.getAddress()),
    });
    const msg = await existAccount.getSignedExternal(
        {
            network: 'mainnet',
            valid_until: Math.floor(Date.now() / 1000) + 60,
            messages: [
                {
                    address: existAccount.getAddress().toString(),
                    amount: '1',
                },
            ],
        },
        { fakeSignature: false },
    );
    logInfo(msg);
    const fee = await tonClient.estimateFee(msg);
    logInfo({ fee });
    const emulation = await tonClient.fetchEmulation(existAccount.getAddress(), [
        {
            address: existAccount.getAddress(),
            amount: '1',
        },
    ]);
    logInfo({ emulation });
    const hash = await tonClient.sendBoc(msg);
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
