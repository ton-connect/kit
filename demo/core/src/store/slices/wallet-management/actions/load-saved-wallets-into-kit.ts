/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ITonWalletKit } from '@ton/walletkit';

import { createWalletAdapter, SimpleEncryption } from '../../../../utils';
import { getWalletKitConfig } from '../../../utils/config';
import { getStore } from '../../../utils/store-instance';
import { walletManagementLog } from '../utils';

export const loadSavedWalletsIntoKit = async (walletKit: ITonWalletKit) => {
    const store = getStore();
    const state = store.getState();
    const walletKitConfig = getWalletKitConfig();

    if (!state.auth.currentPassword) {
        walletManagementLog.warn('Cannot load wallets: user not authenticated');
        return;
    }

    const savedWallets = state.walletManagement.savedWallets;
    if (savedWallets.length === 0) {
        walletManagementLog.info('No saved wallets to load');
        return;
    }

    walletManagementLog.info(`Loading ${savedWallets.length} saved wallets into WalletKit`);

    for (const savedWallet of savedWallets) {
        try {
            // Check if wallet already loaded using kitWalletId
            if (savedWallet.kitWalletId && walletKit.getWallet(savedWallet.kitWalletId)) {
                walletManagementLog.info(`Wallet ${savedWallet.name} already loaded`);
                continue;
            }

            let walletAdapter;
            const walletNetwork = savedWallet.network || 'testnet';

            if (savedWallet.walletType === 'ledger' && savedWallet.ledgerConfig) {
                if (!walletKitConfig?.createLedgerTransport) {
                    walletManagementLog.warn(
                        `Skipping Ledger wallet ${savedWallet.id}: createLedgerTransport not provided`,
                    );
                    continue;
                }
                walletAdapter = await createWalletAdapter({
                    useWalletInterfaceType: 'ledger',
                    ledgerAccountNumber: savedWallet.ledgerConfig.accountIndex,
                    storedLedgerConfig: savedWallet.ledgerConfig,
                    network: walletNetwork,
                    walletKit,
                    version: savedWallet.version || 'v4r2',
                    createLedgerTransport: walletKitConfig.createLedgerTransport,
                });
            } else if (savedWallet.encryptedMnemonic) {
                const mnemonicJson = await SimpleEncryption.decrypt(
                    savedWallet.encryptedMnemonic,
                    state.auth.currentPassword,
                );
                const mnemonic = JSON.parse(mnemonicJson) as string[];

                walletAdapter = await createWalletAdapter({
                    mnemonic,
                    useWalletInterfaceType: savedWallet.walletInterfaceType,
                    ledgerAccountNumber: state.auth.ledgerAccountNumber,
                    storedLedgerConfig: undefined,
                    network: walletNetwork,
                    walletKit,
                    version: savedWallet.version || 'v5r1',
                });
            } else {
                walletManagementLog.warn(`Skipping wallet ${savedWallet.id}: no mnemonic or ledger config`);
                continue;
            }

            await walletKit.addWallet(walletAdapter);
            walletManagementLog.info(`Loaded wallet ${savedWallet.name} (${savedWallet.address})`);
        } catch (error) {
            walletManagementLog.error(`Failed to load wallet ${savedWallet.name}:`, error);
        }
    }
};
