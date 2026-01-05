/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SimpleEncryption } from '../../../../utils';
import { getStore } from '../../../utils/store-instance';
import { walletManagementLog } from '../utils';

export const getDecryptedMnemonic = async (walletId?: string): Promise<string[] | null> => {
    const store = getStore();
    const state = store.getState();

    if (!state.auth.currentPassword) {
        walletManagementLog.error('No current password available');
        return null;
    }

    try {
        const targetWalletId = walletId || state.walletManagement.activeWalletId;
        if (!targetWalletId) {
            walletManagementLog.error('No wallet ID provided or active');
            return null;
        }

        const savedWallet = state.walletManagement.savedWallets.find((w) => w.id === targetWalletId);
        if (!savedWallet || !savedWallet.encryptedMnemonic) {
            walletManagementLog.error('No encrypted mnemonic found for wallet');
            return null;
        }

        const decryptedString = await SimpleEncryption.decrypt(
            savedWallet.encryptedMnemonic,
            state.auth.currentPassword,
        );

        const mnemonic = JSON.parse(decryptedString) as string[];

        if (!mnemonic || mnemonic.length === 0) {
            walletManagementLog.error('Decrypted mnemonic is empty');
            return null;
        }

        return mnemonic;
    } catch (error) {
        walletManagementLog.error('Error decrypting mnemonic:', error);
        return null;
    }
};
