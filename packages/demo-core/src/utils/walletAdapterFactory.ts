/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    type IWalletAdapter,
    Signer,
    WalletV5R1Adapter,
    WalletV4R2Adapter,
    DefaultSignature,
    CHAIN,
    type ITonWalletKit,
    MnemonicToKeyPair,
    type WalletSigner,
    Uint8ArrayToHex,
    type ToncenterTransaction,
} from '@ton/walletkit';
import { createWalletInitConfigLedger, createLedgerPath, createWalletV4R2Ledger } from '@ton/v4ledger-adapter';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';

import type { LedgerConfig, PreviewTransaction, SavedWallet } from '../types/wallet';
import { createComponentLogger } from './logger';

const log = createComponentLogger('WalletAdapterFactory');

export interface CreateWalletAdapterParams {
    mnemonic?: string[];
    useWalletInterfaceType: 'signer' | 'mnemonic' | 'ledger';
    ledgerAccountNumber?: number;
    storedLedgerConfig?: LedgerConfig;
    network: 'mainnet' | 'testnet';
    walletKit: ITonWalletKit;
    version: 'v5r1' | 'v4r2';
}

/**
 * Creates a wallet adapter based on the specified type and configuration
 */
export async function createWalletAdapter(params: CreateWalletAdapterParams): Promise<IWalletAdapter> {
    const {
        mnemonic,
        useWalletInterfaceType,
        ledgerAccountNumber = 0,
        storedLedgerConfig,
        network,
        walletKit,
        version = 'v5r1',
    } = params;

    while (!walletKit.isReady()) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const chainNetwork = network === 'mainnet' ? CHAIN.MAINNET : CHAIN.TESTNET;

    switch (useWalletInterfaceType) {
        case 'signer': {
            if (!mnemonic) {
                throw new Error('Mnemonic required for signer wallet type');
            }
            const keyPair = await MnemonicToKeyPair(mnemonic);

            const customSigner: WalletSigner = {
                sign: async (bytes: Iterable<number>) => {
                    if (confirm('Are you sure you want to sign?')) {
                        return DefaultSignature(bytes, keyPair.secretKey);
                    }
                    throw new Error('User did not confirm');
                },
                publicKey: Uint8ArrayToHex(keyPair.publicKey),
            };

            if (version === 'v5r1') {
                return await WalletV5R1Adapter.create(customSigner, {
                    client: walletKit.getApiClient(chainNetwork),
                    network: chainNetwork,
                });
            } else {
                return await WalletV4R2Adapter.create(customSigner, {
                    client: walletKit.getApiClient(chainNetwork),
                    network: chainNetwork,
                });
            }
        }
        case 'mnemonic': {
            if (!mnemonic) {
                throw new Error('Mnemonic required for mnemonic wallet type');
            }

            const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });

            if (version === 'v5r1') {
                return await WalletV5R1Adapter.create(signer, {
                    client: walletKit.getApiClient(chainNetwork),
                    network: chainNetwork,
                });
            } else {
                return await WalletV4R2Adapter.create(signer, {
                    client: walletKit.getApiClient(chainNetwork),
                    network: chainNetwork,
                });
            }
        }
        case 'ledger': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (typeof navigator === 'undefined' || !(navigator as any).usb) {
                throw new Error('WebUSB not supported in this environment');
            }

            try {
                if (storedLedgerConfig) {
                    return createWalletV4R2Ledger(
                        createWalletInitConfigLedger({
                            createTransport: async () => await TransportWebHID.create(),
                            path: storedLedgerConfig.path,
                            publicKey: Buffer.from(storedLedgerConfig.publicKey.substring(2), 'hex'),
                            version: storedLedgerConfig.version as 'v4r2',
                            network: storedLedgerConfig.network === 'mainnet' ? CHAIN.MAINNET : CHAIN.TESTNET,
                            workchain: storedLedgerConfig.workchain,
                            walletId: storedLedgerConfig.walletId,
                            accountIndex: storedLedgerConfig.accountIndex,
                        }),
                        {
                            tonClient: walletKit.getApiClient(chainNetwork),
                        },
                    );
                }

                const path = createLedgerPath(chainNetwork === CHAIN.TESTNET, 0, ledgerAccountNumber);

                return createWalletV4R2Ledger(
                    createWalletInitConfigLedger({
                        createTransport: async () => await TransportWebHID.create(),
                        path,
                        version: 'v4r2',
                        network: chainNetwork,
                        workchain: 0,
                        accountIndex: ledgerAccountNumber,
                    }),
                    {
                        tonClient: walletKit.getApiClient(chainNetwork),
                    },
                );
            } catch (error) {
                log.error('Failed to create Ledger transport:', error);
                throw new Error('Failed to connect to Ledger device');
            }
        }
        default:
            throw new Error(`Invalid wallet interface type: ${useWalletInterfaceType}`);
    }
}

/**
 * Transforms a Toncenter transaction to our PreviewTransaction type
 */
export function transformToncenterTransaction(tx: ToncenterTransaction): PreviewTransaction {
    let type: 'send' | 'receive' = 'receive';
    let amount = '0';
    let address = '';

    if (tx.in_msg && tx.in_msg.value) {
        amount = tx.in_msg.value;
        address = tx.in_msg.source || '';
        type = 'receive';
    }

    if (tx.out_msgs && tx.out_msgs.length > 0) {
        const mainOutMsg = tx.out_msgs[0];
        if (mainOutMsg.value) {
            amount = mainOutMsg.value;
            address = mainOutMsg.destination;
            type = 'send';
        }
    }

    let status: 'pending' | 'confirmed' | 'failed' = 'confirmed';
    if (tx.description.aborted) {
        status = 'failed';
    } else if (!tx.description.compute_ph.success) {
        status = 'failed';
    }

    return {
        id: tx.hash,
        traceId: tx.trace_id || undefined,
        messageHash: tx.in_msg?.hash || '',
        type,
        amount,
        address,
        timestamp: tx.now * 1000,
        status,
        externalMessageHash: tx.trace_external_hash || undefined,
    };
}

/**
 * Generates a unique wallet ID
 */
export function generateWalletId(): string {
    return `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a default wallet name based on existing wallets
 */
export function generateWalletName(existingWallets: SavedWallet[], type: 'mnemonic' | 'signer' | 'ledger'): string {
    const prefix = type === 'ledger' ? 'Ledger' : 'Wallet';
    let counter = existingWallets.filter((w) => w.name.startsWith(prefix)).length + 1;
    let name = `${prefix} ${counter}`;

    while (existingWallets.some((w) => w.name === name)) {
        counter++;
        name = `${prefix} ${counter}`;
    }

    return name;
}
