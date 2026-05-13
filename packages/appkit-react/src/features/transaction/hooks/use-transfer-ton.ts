/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import type {
    TransferTonData,
    TransferTonErrorType,
    TransferTonOptions,
    TransferTonVariables,
} from '@ton/appkit/queries';
import { transferTonMutationOptions } from '@ton/appkit/queries';

import { useMutation } from '../../../libs/query';
import type { UseMutationReturnType } from '../../../libs/query';
import { useAppKit } from '../../settings';

/**
 * Parameters accepted by {@link useTransferTon} — TanStack Query mutation options.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export type UseTransferTonParameters<context = unknown> = TransferTonOptions<context>;

/**
 * Return type of {@link useTransferTon} — TanStack Query mutation result.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export type UseTransferTonReturnType<context = unknown> = UseMutationReturnType<
    TransferTonData,
    TransferTonErrorType,
    TransferTonVariables,
    context,
    (
        variables: TransferTonVariables,
        options?: MutateOptions<TransferTonData, TransferTonErrorType, TransferTonVariables, context>,
    ) => void,
    MutateFunction<TransferTonData, TransferTonErrorType, TransferTonVariables, context>
>;

/**
 * Send TON from the selected wallet in one step — builds the transfer message, hands it to the wallet for signing and broadcasts it. Call `mutate` with a `recipientAddress`, an `amount` (in TON as a human-readable decimal, converted to nano-TON internally) and any of the optional `comment` / `payload` / `stateInit` fields. On success, `data` carries the BoC and normalized hash of the broadcast transaction — pair with {@link useTransactionStatus} to poll the trace to completion. Throws `Error('Wallet not connected')` if no wallet is currently selected — TanStack Query surfaces it via the mutation's `error`.
 *
 * @param parameters - {@link UseTransferTonParameters} TanStack Query mutation overrides.
 * @returns Mutation result for the transfer call.
 *
 * @public
 * @category Hook
 * @section Transactions
 */
export const useTransferTon = <context = unknown>(
    parameters: UseTransferTonParameters<context> = {},
): UseTransferTonReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(transferTonMutationOptions(appKit, parameters));
};
