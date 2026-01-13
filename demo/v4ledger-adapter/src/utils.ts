/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Utility functions for WalletV4R2 Ledger adapter

import { CHAIN } from '@tonconnect/protocol';
import { TonTransport } from '@ton-community/ton-ledger';
import type Transport from '@ledgerhq/hw-transport';
import type { WalletAdapter, ApiClient } from '@ton/walletkit';
import {
    Network,
    // globalLogger,
} from '@ton/walletkit';

import { WalletV4R2LedgerAdapter } from './WalletV4R2LedgerAdapter';
import type { WalletInitConfigLedgerInterface } from './types';

// const log = globalLogger.createChild('WalletV4R2Utils');
const log = {
    error: (_message: string, _data: unknown) => {
        // console.error(message, data);
    },
};

/**
 * Utility function to create Ledger derivation path
 */
export function createLedgerPath(testnet: boolean = false, workchain: number = 0, account: number = 0): number[] {
    const network = testnet ? 1 : 0;
    const chain = workchain === -1 ? 255 : 0;
    return [44, 607, network, chain, account, 0];
}

export function isWalletInitConfigLedger(config: unknown): config is WalletInitConfigLedgerInterface {
    if (typeof config !== 'object' || config === null) {
        return false;
    }
    return 'createTransport' in config && 'path' in config;
}

/**
 * Utility function to create WalletV4R2 Ledger adapter from Ledger configuration
 */
export async function createWalletV4R2Ledger(
    config: WalletInitConfigLedgerInterface,
    options: {
        tonClient: ApiClient;
    },
): Promise<WalletAdapter> {
    if (!isWalletInitConfigLedger(config)) {
        throw new Error('Invalid Ledger configuration');
    }

    let transport: Transport | undefined;
    try {
        let publicKey: Uint8Array;
        if (config.publicKey) {
            publicKey = Uint8Array.from(config.publicKey);
        } else {
            transport = await config.createTransport();
            const tonTransport = new TonTransport(transport);
            // Get address and public key from Ledger
            const response = await tonTransport.getAddress(config.path, {
                chain: config.workchain ?? 0,
                bounceable: false,
                testOnly: config.network?.chainId === CHAIN.TESTNET,
                walletVersion: 'v4',
            });
            publicKey = response.publicKey;
        }

        return new WalletV4R2LedgerAdapter({
            createTransport: config.createTransport,
            path: config.path,
            publicKey: publicKey,
            walletId: config.walletId,
            tonClient: options.tonClient,
            network: config.network || Network.mainnet(),
            workchain: config.workchain,
        });
    } catch (error) {
        log.error('Failed to create Ledger adapter', { error });
        throw new Error(`Failed to initialize Ledger wallet: ${error}`);
    } finally {
        if (transport) {
            await transport.close();
        }
    }
}
