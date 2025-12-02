/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { mnemonicNew } from '@ton/crypto';

import { tempStorage } from '../../storages/temp-storage';
import { useWalletStore } from '../store';

import { getErrorMessage } from '@/core/utils/errors/get-error-message';

/**
 * Create a new wallet with a generated mnemonic
 * @returns The generated mnemonic as an array of words
 */
export const createWallet = async (): Promise<string[]> => {
    try {
        useWalletStore.setState({ isLoading: true, error: null });

        const tempMnemonic = await tempStorage.getTempMnemonic();
        const mnemonicArray = tempMnemonic ? tempMnemonic.split(' ') : await mnemonicNew(24);
        await tempStorage.saveTempMnemonic(mnemonicArray.join(' '));

        useWalletStore.setState({ isLoading: false });

        return mnemonicArray;
    } catch (error) {
        const errorMessage = getErrorMessage(error, 'Failed to create wallet');

        useWalletStore.setState({
            isLoading: false,
            error: errorMessage,
        });

        throw error;
    }
};
