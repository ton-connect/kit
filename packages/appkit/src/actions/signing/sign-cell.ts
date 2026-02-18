/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import type { SignDataResponse } from '../../types/signing';
import { getSelectedWallet } from '../wallets/get-selected-wallet';
import type { Base64String } from '../../types/primitives';

export interface SignCellParameters {
    /** Base64 encoded Bag of Cells */
    cell: Base64String;
    /** TL-B schema for the cell structure */
    schema: string;
    /** Optional network (mainnet/testnet) */
    network?: Network;
}

export type SignCellReturnType = SignDataResponse;

/**
 * Sign a TON Cell with the connected wallet.
 * Used for on-chain signature verification.
 *
 * @example
 * ```ts
 * const result = await signCell(appKit, {
 *   cell: bocBase64,
 *   schema: "transfer#abc123 amount:uint64 = Transfer"
 * });
 * console.log(result.signature);
 * ```
 */
export const signCell = async (appKit: AppKit, parameters: SignCellParameters): Promise<SignCellReturnType> => {
    const wallet = getSelectedWallet(appKit);

    if (!wallet) {
        throw new Error('Wallet not connected');
    }

    return await wallet.signData({
        network: parameters.network,
        data: {
            type: 'cell',
            value: {
                content: parameters.cell,
                schema: parameters.schema,
            },
        },
    });
};
