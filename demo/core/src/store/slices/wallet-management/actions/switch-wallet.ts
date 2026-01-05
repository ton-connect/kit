/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getWalletKitConfig } from '../../../utils/config';
import { createWalletAdapter, SimpleEncryption } from '../../../../utils';
import { getStore } from '../../../utils/store-instance';
import { walletManagementLog } from '../utils';
import { loadEvents } from './load-events';

export const switchWallet = async (walletId: string) => {
    const store = getStore();
    const state = store.getState();
    const walletKitConfig = getWalletKitConfig();

    if (!state.auth.currentPassword) {
        throw new Error('User not authenticated');
    }

    if (!state.walletCore.walletKit) {
        throw new Error('WalletKit not initialized');
    }

    const savedWallet = state.walletManagement.savedWallets.find((w) => w.id === walletId);
    if (!savedWallet) {
        throw new Error('Wallet not found');
    }

    try {
        walletManagementLog.info(`Switching to wallet ${walletId} (${savedWallet.name})`);

        let wallet = savedWallet.kitWalletId
            ? state.walletCore.walletKit.getWallet(savedWallet.kitWalletId)
            : undefined;

        if (!wallet) {
            const walletNetwork = savedWallet.network || 'testnet';

            if (savedWallet.walletType === 'ledger') {
                if (!walletKitConfig?.createLedgerTransport) {
                    throw new Error('createLedgerTransport is required for Ledger wallet');
                }
                const walletAdapter = await createWalletAdapter({
                    useWalletInterfaceType: 'ledger',
                    ledgerAccountNumber: savedWallet.ledgerConfig?.accountIndex,
                    storedLedgerConfig: savedWallet.ledgerConfig,
                    network: walletNetwork,
                    walletKit: state.walletCore.walletKit,
                    version: savedWallet.version || 'v4r2',
                    createLedgerTransport: walletKitConfig.createLedgerTransport,
                });

                await state.walletCore.walletKit.addWallet(walletAdapter);
            } else if (savedWallet.encryptedMnemonic) {
                const decryptedString = await SimpleEncryption.decrypt(
                    savedWallet.encryptedMnemonic,
                    state.auth.currentPassword,
                );
                const mnemonic = JSON.parse(decryptedString) as string[];

                const walletAdapter = await createWalletAdapter({
                    mnemonic,
                    useWalletInterfaceType: savedWallet.walletInterfaceType,
                    ledgerAccountNumber: state.auth.ledgerAccountNumber,
                    storedLedgerConfig: undefined,
                    network: walletNetwork,
                    walletKit: state.walletCore.walletKit,
                    version: savedWallet.version || 'v5r1',
                });

                await state.walletCore.walletKit.addWallet(walletAdapter);
            }
        }

        if (!wallet) {
            throw new Error('Failed to load wallet');
        }

        const balance = await wallet.getBalance();

        store.setState((state) => {
            state.walletManagement.activeWalletId = walletId;
            state.walletManagement.address = savedWallet.address;
            state.walletManagement.publicKey = savedWallet.publicKey;
            state.walletManagement.balance = balance.toString();
            state.walletManagement.currentWallet = wallet;
            state.walletManagement.events = [];

            return state;
        });

        await loadEvents();

        walletManagementLog.info(`Switched to wallet ${walletId} successfully`);
    } catch (error) {
        walletManagementLog.error('Error switching wallet:', error);
        throw new Error('Failed to switch wallet');
    }
};
