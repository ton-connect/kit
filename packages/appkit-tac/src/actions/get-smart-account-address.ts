/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getSelectedWallet } from '@ton/appkit';
import type { AppKit } from '@ton/appkit';

import { getTacProvider } from './get-tac-provider';

export interface GetSmartAccountAddressOptions {
    /** EVM address of the target application contract */
    applicationAddress: string;
}

export type GetSmartAccountAddressReturnType = Promise<string>;

/**
 * Get the TAC smart account address for a given TON wallet and EVM application.
 * The smart account acts as a proxy for the user on TAC EVM.
 */
export const getSmartAccountAddress = async (
    appKit: AppKit,
    options: GetSmartAccountAddressOptions,
): GetSmartAccountAddressReturnType => {
    const provider = getTacProvider(appKit);

    if (!provider) {
        throw new Error('TAC provider is not registered');
    }

    const selectedWallet = getSelectedWallet(appKit);
    if (!selectedWallet) {
        throw new Error('Wallet is not selected');
    }

    return provider.sdk.getSmartAccountAddressForTvmWallet(selectedWallet.getAddress(), options.applicationAddress);
};
