/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

// Example: AppKit usage with TonConnect

import TonConnect from '@tonconnect/sdk';
import { Network } from '@ton/walletkit';

import { CreateAppKit } from '../index';
import { FSStorage } from './FSStorage';

async function main() {
    const tonConnect = new TonConnect({
        storage: new FSStorage('./temp/storage.json'),
        manifestUrl: 'https://tonconnect-demo-dapp-with-react-ui.vercel.app/tonconnect-manifest.json',
    });

    // Create AppKit with network configuration
    const appKit = CreateAppKit({
        networks: {
            [Network.mainnet().chainId]: {
                apiClient: {
                    // Optional API key for Toncenter - get one at https://t.me/toncenter
                    key: process.env.APP_TONCENTER_KEY,
                    url: 'https://toncenter.com', // default
                },
            },
            // Optionally configure testnet as well
            // [Network.testnet().chainId]: {
            //     apiClient: {
            //         key: process.env.APP_TONCENTER_KEY_TESTNET,
            //         url: 'https://testnet.toncenter.com',
            //     },
            // },
        },
    });

    tonConnect.onStatusChange(async (wallet) => {
        console.log('Status changed:', wallet);

        if (wallet) {
            const tonWallet = appKit.wrapTonConnectWallet(wallet, tonConnect);

            await tonWallet.createTransferJettonTransaction({
                transferAmount: '1',
                jettonAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
                recipientAddress: tonWallet.getAddress(),
                comment: 'Hello!',
            });
        }
    });

    await tonConnect.restoreConnection();
    const wallets = await tonConnect.getWallets();
    console.log('Wallets:', wallets[1]);

    const wallet = wallets[1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (wallet as any).jsBridgeKey = undefined;

    while (true) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log('Waiting...');
    }
}

main();
