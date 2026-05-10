/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { Network } from '../../types/network';
import type { TransactionStatusResponse } from '../../types/transaction';
import { getTransactionStatusFromClient as walletKitGetTransactionStatus } from '../../utils';
import { resolveNetwork } from '../../utils/network/resolve-network';

/**
 * Parameters accepted by {@link getTransactionStatus} — must carry exactly one of `boc` or `normalizedHash`, plus an optional network override.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export type GetTransactionStatusParameters = {
    /** Network to check the transaction on. Defaults to the selected wallet's network; if no wallet is selected, falls back to AppKit's default network, or mainnet when none is set. */
    network?: Network;
} & (
    | {
          /** Base64-encoded BoC of the sent transaction (returned by {@link sendTransaction}). */
          boc: string;
          normalizedHash?: never;
      }
    | {
          boc?: never;
          /** Hex-encoded normalized hash of the external-in message (returned by {@link sendTransaction} as `normalizedHash`). */
          normalizedHash: string;
      }
);

/**
 * Return type of {@link getTransactionStatus}.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export type GetTransactionStatusReturnType = TransactionStatusResponse;

export type GetTransactionStatusErrorType = Error;

/**
 * Read the status of a sent transaction by its BoC or normalized hash. In TON a single external message triggers a tree of internal messages — the transaction is `'completed'` only when the entire trace finishes; until then it stays `'pending'`. Throws when neither `boc` nor `normalizedHash` is provided.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link GetTransactionStatusParameters} `boc` xor `normalizedHash` and optional network override.
 * @returns Status response with current state, completed/total message counts and trace details.
 *
 * @public
 * @category Action
 * @section Transactions
 */
export const getTransactionStatus = async (
    appKit: AppKit,
    parameters: GetTransactionStatusParameters,
): Promise<GetTransactionStatusReturnType> => {
    const { boc, normalizedHash, network } = parameters;

    const client = appKit.networkManager.getClient(resolveNetwork(appKit, network));

    if (boc) {
        return walletKitGetTransactionStatus(client, { boc });
    }

    if (normalizedHash) {
        return walletKitGetTransactionStatus(client, { normalizedHash });
    }

    throw new Error('Either boc or normalizedHash must be provided');
};
