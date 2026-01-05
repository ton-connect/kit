/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SavedWallet } from '../../../../types';
import { createWalletAdapter, generateWalletId, generateWalletName, SimpleEncryption } from '../../../../utils';
import { getStore } from '../../../utils/store-instance';
import { walletManagementLog } from '../utils';

export const createWallet = async (
    mnemonic: string[],
    name?: string,
    version?: 'v5r1' | 'v4r2',
    network?: 'mainnet' | 'testnet',
) => {
    const store = getStore();
    const state = store.getState();

    if (!state.auth.currentPassword) {
        throw new Error('User not authenticated');
    }

    if (!state.walletCore.walletKit) {
        throw new Error('WalletKit not initialized');
    }

    try {
        const walletId = generateWalletId();
        const walletName =
            name ||
            generateWalletName(state.walletManagement.savedWallets, state.auth.useWalletInterfaceType || 'mnemonic');

        const encryptedMnemonic = await SimpleEncryption.encrypt(JSON.stringify(mnemonic), state.auth.currentPassword);

        const walletVersion = version || 'v5r1';

        const walletNetwork = network || 'testnet';
        const walletAdapter = await createWalletAdapter({
            mnemonic,
            useWalletInterfaceType: state.auth.useWalletInterfaceType || 'mnemonic',
            ledgerAccountNumber: state.auth.ledgerAccountNumber,
            storedLedgerConfig: undefined,
            network: walletNetwork,
            walletKit: state.walletCore.walletKit,
            version: walletVersion,
        });

        const wallet = await state.walletCore.walletKit.addWallet(walletAdapter);
        if (!wallet) {
            throw new Error('Failed to find created wallet');
        }

        const address = wallet.getAddress();
        const publicKey = wallet.getPublicKey();

        const savedWallet: SavedWallet = {
            id: walletId,
            name: walletName,
            address,
            publicKey,
            encryptedMnemonic,
            walletType: state.auth.useWalletInterfaceType || 'mnemonic',
            walletInterfaceType: state.auth.useWalletInterfaceType || 'mnemonic',
            version: walletVersion,
            network: walletNetwork,
            createdAt: Date.now(),
            kitWalletId: wallet.getWalletId(),
        };

        store.setState((state) => {
            state.walletManagement.savedWallets.push(savedWallet);
            state.walletManagement.hasWallet = true;
            state.walletManagement.isAuthenticated = true;
            state.walletManagement.activeWalletId = walletId;
            state.walletManagement.address = address;
            state.walletManagement.publicKey = publicKey;
            state.walletManagement.balance = '0';
            state.walletManagement.currentWallet = wallet;

            return state;
        });

        walletManagementLog.info(`Created wallet ${walletId} (${walletName})`);
        return walletId;
    } catch (error) {
        walletManagementLog.error('Error creating wallet:', error);
        throw error instanceof Error ? error : new Error('Failed to create wallet');
    }
};
