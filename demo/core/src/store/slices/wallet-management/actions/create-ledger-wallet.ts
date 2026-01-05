/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createLedgerPath } from '@ton/v4ledger-adapter';
import { Network } from '@ton/walletkit';

import { getWalletKitConfig } from '../../../utils/config';
import type { LedgerConfig, SavedWallet } from '../../../../types';
import { createWalletAdapter, generateWalletId, generateWalletName } from '../../../../utils';
import { getStore } from '../../../utils/store-instance';
import { walletManagementLog } from '../utils';

export const createLedgerWallet = async (name?: string, network?: 'mainnet' | 'testnet') => {
    const store = getStore();
    const state = store.getState();
    const walletKitConfig = getWalletKitConfig();

    if (!state.auth.currentPassword) {
        throw new Error('User not authenticated');
    }

    if (state.auth.useWalletInterfaceType !== 'ledger') {
        throw new Error('Wallet type must be set to ledger');
    }

    if (!state.walletCore.walletKit) {
        throw new Error('WalletKit not initialized');
    }

    try {
        const getneratedWalletId = generateWalletId();
        const walletName = name || generateWalletName(state.walletManagement.savedWallets, 'ledger');
        const version = 'v4r2';
        const walletNetwork = network || 'mainnet';

        if (!walletKitConfig?.createLedgerTransport) {
            throw new Error('createLedgerTransport is required for Ledger wallet');
        }

        const walletAdapter = await createWalletAdapter({
            useWalletInterfaceType: 'ledger',
            ledgerAccountNumber: state.auth.ledgerAccountNumber,
            storedLedgerConfig: undefined,
            network: walletNetwork,
            walletKit: state.walletCore.walletKit,
            version: version,
            createLedgerTransport: walletKitConfig.createLedgerTransport,
        });

        const wallet = await state.walletCore.walletKit.addWallet(walletAdapter);

        if (!wallet) {
            throw new Error('Failed to find created Ledger wallet');
        }

        const address = wallet.getAddress();
        const kitWalletId = wallet.getWalletId();

        const existingWallet = state.walletManagement.savedWallets.find((w) => w.kitWalletId === kitWalletId);
        if (existingWallet) {
            walletManagementLog.warn(`Wallet with walletId ${kitWalletId} already exists`);
            throw new Error('A wallet with this walletId already exists');
        }

        const balance = await wallet.getBalance();
        const publicKey = wallet.getPublicKey();

        const ledgerPath = createLedgerPath(
            wallet.getNetwork().chainId === Network.testnet().chainId,
            0,
            state.auth.ledgerAccountNumber || 0,
        );
        const ledgerConfig: LedgerConfig = {
            publicKey: publicKey,
            path: ledgerPath,
            walletId: 698983191,
            version: version,
            network: walletNetwork,
            workchain: 0,
            accountIndex: state.auth.ledgerAccountNumber || 0,
        };

        const savedWallet: SavedWallet = {
            id: getneratedWalletId,
            name: walletName,
            address,
            publicKey,
            ledgerConfig,
            walletType: 'ledger',
            walletInterfaceType: 'ledger',
            version: version,
            network: walletNetwork,
            createdAt: Date.now(),
            kitWalletId: wallet.getWalletId(),
        };

        store.setState((state) => {
            state.walletManagement.savedWallets.push(savedWallet);
            state.walletManagement.hasWallet = true;
            state.walletManagement.isAuthenticated = true;
            state.walletManagement.activeWalletId = getneratedWalletId;
            state.walletManagement.address = address;
            state.walletManagement.publicKey = publicKey;
            state.walletManagement.balance = balance.toString();
            state.walletManagement.currentWallet = wallet;

            return state;
        });

        walletManagementLog.info(`Created Ledger wallet ${getneratedWalletId} (${walletName})`);
        return getneratedWalletId;
    } catch (error) {
        walletManagementLog.error('Error creating Ledger wallet:', error);
        throw error instanceof Error ? error : new Error('Failed to create Ledger wallet');
    }
};
