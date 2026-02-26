/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionStatusResponse } from '@ton/walletkit';
import { getTransactionStatus as walletKitGetTransactionStatus } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { Network } from '../../types/network';

export type GetTransactionStatusParameters = {
    /** Network to check the transaction on */
    network?: Network;
} & (
    | {
          /** BOC of the sent transaction (base64) */
          boc: string;
          /** Hash of the sent transaction (base64) */
          normalizedHash?: never;
      }
    | {
          /** BOC of the sent transaction (base64) */
          boc?: never;
          /** Normalized Hash of the external-in transaction (base64) */
          normalizedHash: string;
      }
);

export type GetTransactionStatusReturnType = TransactionStatusResponse;

export type GetTransactionStatusErrorType = Error;

/**
 * Get the status of a transaction by its BOC.
 *
 * In TON, a single external message triggers a tree of internal messages.
 * The transaction is "complete" only when the entire trace finishes.
 * This action checks toncenter's trace endpoints to determine the current status.
 *
 * @example
 * ```ts
 * const result = await sendTransaction(appKit, { messages: [...] });
 * const status = await getTransactionStatus(appKit, { boc: result.boc });
 * // status.status === 'pending' | 'completed' | 'failed'
 * // status.completedMessages === 3
 * // status.totalMessages === 5
 * ```
 */
export const getTransactionStatus = async (
    appKit: AppKit,
    parameters: GetTransactionStatusParameters,
): Promise<GetTransactionStatusReturnType> => {
    const { boc, normalizedHash, network } = parameters;

    const client = appKit.networkManager.getClient(network ?? Network.mainnet());

    if (boc) {
        return walletKitGetTransactionStatus(client, { boc });
    }

    if (normalizedHash) {
        return walletKitGetTransactionStatus(client, { normalizedHash });
    }

    throw new Error('Either boc or normalizedHash must be provided');
};
