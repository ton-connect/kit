/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { switchWallet } from './switch-wallet';
import { createWalletAdapter, SimpleEncryption } from '../../../../utils';
import { getWalletKitConfig } from '../../../utils/config';
import { getStore } from '../../../utils/store-instance';
import { walletManagementLog } from '../utils';

export const loadAllWallets = async () => {
    const store = getStore();
    let state = store.getState();
    const walletKitConfig = getWalletKitConfig();

    if (!state.auth.currentPassword) {
        throw new Error('User not authenticated');
    }

    state = store.getState();

    if (state.walletCore.walletKitInitializer) {
        await state.walletCore.walletKitInitializer;
    }

    state = store.getState();

    if (!state.auth.currentPassword) {
        throw new Error('User not authenticated');
    }

    if (!state.walletCore.walletKit) {
        throw new Error('WalletKit not initialized');
    }

    try {
        walletManagementLog.info(`Loading ${state.walletManagement.savedWallets.length} saved wallets`);

        for (const savedWallet of state.walletManagement.savedWallets) {
            // Check if wallet already loaded using kitWalletId or address fallback
            const existingWallet = savedWallet.kitWalletId
                ? state.walletCore.walletKit.getWallet(savedWallet.kitWalletId)
                : undefined;

            if (existingWallet) {
                walletManagementLog.info(`Wallet ${savedWallet.id} already loaded`);
                continue;
            }

            const walletNetwork = savedWallet.network || 'testnet';

            if (savedWallet.walletType === 'ledger') {
                if (!walletKitConfig?.createLedgerTransport) {
                    walletManagementLog.warn(
                        `Skipping Ledger wallet ${savedWallet.id}: createLedgerTransport not provided`,
                    );
                    continue;
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

        if (state.walletManagement.savedWallets.length > 0 && !state.walletManagement.activeWalletId) {
            await switchWallet(state.walletManagement.savedWallets[0].id);
        } else if (state.walletManagement.activeWalletId) {
            await switchWallet(state.walletManagement.activeWalletId);
        }

        store.setState((state) => {
            state.walletManagement.hasWallet = state.walletManagement.savedWallets.length > 0;
            state.walletManagement.isAuthenticated = state.walletManagement.savedWallets.length > 0;

            return state;
        });

        walletManagementLog.info('All wallets loaded successfully');
    } catch (error) {
        walletManagementLog.error('Error loading wallets:', error);
        throw new Error('Failed to load wallets');
    }
};
