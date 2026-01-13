/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// SAMPLE_START: INIT_KIT_1
import {
    TonWalletKit, // Main SDK class
    Signer, // Handles cryptographic signing
    WalletV5R1Adapter, // Latest wallet version (recommended)
    Network, // Network configuration (mainnet/testnet)
    CHAIN, // Chain constants (mainnet/testnet)
    MemoryStorageAdapter,
} from '@ton/walletkit';

import { getTonConnectDeviceInfo, getTonConnectWalletManifest } from './walletManifest';
// SAMPLE_END: INIT_KIT_1

export async function walletKitInitializeSample(): Promise<TonWalletKit> {
    console.log('=== WalletKit Initialize ===');
    console.log('Step 1: Creating WalletKit instance...');
    // SAMPLE_START: INIT_KIT_2
    const kit = new TonWalletKit({
        deviceInfo: getTonConnectDeviceInfo(),
        walletManifest: getTonConnectWalletManifest(),
        storage: new MemoryStorageAdapter({}),
        // Multi-network API configuration
        networks: {
            [CHAIN.MAINNET]: {
                apiClient: {
                    // Optional API key for Toncenter get on https://t.me/toncenter
                    key: process.env.APP_TONCENTER_KEY,
                    url: 'https://toncenter.com', // default
                    // or use self-hosted from https://github.com/toncenter/ton-http-api
                },
            },
            // Optionally configure testnet as well
            // [CHAIN.TESTNET]: {
            //   apiClient: {
            //     key: process.env.APP_TONCENTER_KEY_TESTNET,
            //     url: 'https://testnet.toncenter.com',
            //   },
            // },
        },
        bridge: {
            // TON Connect bridge for dApp communication
            bridgeUrl: 'https://connect.ton.org/bridge',
            // or use self-hosted bridge from https://github.com/ton-connect/bridge
        },
    });
    // SAMPLE_END: INIT_KIT_2
    console.log('✓ WalletKit instance created');

    console.log('Step 2: Waiting for WalletKit to be ready...');
    // SAMPLE_START: INIT_KIT_3
    // Wait for initialization to complete
    await kit.waitForReady();
    // SAMPLE_END: INIT_KIT_3
    console.log('✓ WalletKit is ready');
    console.log(`Status: ${JSON.stringify(kit.getStatus())}`);
    console.log(`Configured networks: ${JSON.stringify(kit.getConfiguredNetworks())}`);

    console.log('Step 4: Add wallet V5R1...');
    // SAMPLE_START: INIT_KIT_4
    // Add a wallet from mnemonic (24-word seed phrase) ton or bip39
    const mnemonic = process.env.WALLET_MNEMONIC!.split(' ');
    const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });

    const walletV5R1Adapter = await WalletV5R1Adapter.create(signer, {
        client: kit.getApiClient(Network.mainnet()),
        network: Network.mainnet(),
    });

    const walletV5R1 = await kit.addWallet(walletV5R1Adapter);
    if (walletV5R1) {
        console.log('V5R1 Address:', walletV5R1.getAddress());
        console.log('V5R1 Balance:', await walletV5R1.getBalance());
    }
    // SAMPLE_END: INIT_KIT_4
    return kit;
}
