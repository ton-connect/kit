/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */
/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Example usage of AppKit - bridging @tonconnect/sdk to TonWalletKit

import TonConnect from '@tonconnect/sdk';
import { ApiClientToncenter } from '@ton/walletkit';

import { AppKit } from './index';
import { FSStorage } from './FSStorage';

async function main() {
    // 1. Initialize TonWalletKit (this would be in your wallet app)
    // const walletKit = new TonWalletKit({
    //     // Your TonWalletKit configuration
    //     bridge: {
    //         bridgeUrl: 'https://bridge.tonapi.io/bridge',
    //     },
    //     // Add your wallets, storage, etc.
    // });

    const tonConnect = new TonConnect({
        storage: new FSStorage('./temp/storage.json'),
        manifestUrl: 'https://tonconnect-demo-dapp-with-react-ui.vercel.app/tonconnect-manifest.json',
    });
    const appKit = new AppKit({}, tonConnect, new ApiClientToncenter());
    tonConnect.onStatusChange(async (wallet) => {
        console.log('Status changed:', wallet);

        if (wallet) {
            // const tonConnectWallet = new Wallet();
            const tonWallet = appKit.wrapWallet(wallet);
            console.log('createTransferTonTransaction');

            /**
             *
             *
             *
             *
             *
             */
            // const tx = await tonWallet.createTransferTonTransaction({
            //     amount: '1',
            //     toAddress: tonWallet.getAddress(),
            //     comment: 'Hello from ??!',
            // });

            // const tx =
            await tonWallet.createTransferJettonTransaction({
                transferAmount: '1',
                jettonAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
                recipientAddress: tonWallet.getAddress(),
                comment: 'Hello from ??!',
            });
            // const result = await appKit.handleNewTransaction(tonWallet, tx);
            // const tx = await tonConnect.getResponse(requestNumber);

            // const onChainTx = await appKit.findTransaction(result.boc);

            // await tonWallet.sendTransaction(tx);
            /**
             *
             *
             *
             *
             */

            // wallet.connect({
            //     universalLink: 'https://app.tonkeeper.com/ton-connect',
            //     bridgeUrl: 'https://bridge.tonapi.io/bridge',
            // });
        }
    });
    await tonConnect.restoreConnection();
    const wallets = await tonConnect.getWallets();
    console.log('Wallets:', wallets[1]);
    const wallet = wallets[1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (wallet as any).jsBridgeKey = undefined;

    // console.log('Wallet:', wallet);
    // const url = await tonConnect.connect({
    //     bridgeUrl: wallet.bridgeUrl,
    //     universalLink: wallet.universalLink,
    // });
    // console.log('TonConnect URL:', url);
    // console.log('TonConnect initialized');

    // 2. Initialize AppKit

    while (true) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log('Waiting for 1 second');
    }
    // 3. In your dApp, connect with TonConnect

    // Connect to a wallet (this would show the wallet selection UI)
    // await tonConnectWallet.connect({ ... });

    // 4. Once connected, wrap the wallet to get TonWalletKit-compatible interface
    // if (tonConnectWallet.connected) {
    //     const wrappedWallet = appKit.wrapWallet(tonConnectWallet);

    //     // 5. Now you can use TonWalletKit wallet interface!
    //     const transaction = await wrappedWallet.createTransferTonTransaction({
    //         toAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    //         amount: '1000000000', // 1 TON in nanotons
    //         comment: 'Hello from AppKit!',
    //     });

    //     // 6. This will trigger confirmation in the actual wallet app via TonWalletKit
    //     await walletKit.handleNewTransaction(wrappedWallet, transaction);

    //     console.log('Transaction created and sent for confirmation!');
    //     console.log('Wrapped wallet address:', wrappedWallet.getAddress());
    //     console.log('Balance:', await wrappedWallet.getBalance());
    // } else {
    //     console.log('Please connect your wallet first');
    // }
}

main();

// Demo function (uncomment to run)
// _exampleUsage().catch(console.error);
