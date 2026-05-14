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
    TransferJettonData,
    TransferJettonErrorType,
    TransferJettonOptions,
    TransferJettonVariables,
} from '@ton/appkit/queries';
import { transferJettonMutationOptions } from '@ton/appkit/queries';

import { useMutation } from '../../../libs/query';
import type { UseMutationReturnType } from '../../../libs/query';
import { useAppKit } from '../../settings';

/**
 * Parameters accepted by {@link useTransferJetton} — TanStack Query mutation options.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type UseTransferJettonParameters<context = unknown> = TransferJettonOptions<context>;

/**
 * Return type of {@link useTransferJetton} — TanStack Query mutation result.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type UseTransferJettonReturnType<context = unknown> = UseMutationReturnType<
    TransferJettonData,
    TransferJettonErrorType,
    TransferJettonVariables,
    context,
    (
        variables: TransferJettonVariables,
        options?: MutateOptions<TransferJettonData, TransferJettonErrorType, TransferJettonVariables, context>,
    ) => void,
    MutateFunction<TransferJettonData, TransferJettonErrorType, TransferJettonVariables, context>
>;

/**
 * Transfer a jetton from the selected wallet in one step — derives the owner's jetton-wallet from the master address, builds the transfer message, signs it through the wallet and broadcasts it. Call `mutate` with the `jettonAddress` (master), the `recipientAddress`, an `amount` (in jetton units as a human-readable decimal — converted into raw smallest units using `jettonDecimals`), the `jettonDecimals` itself and an optional `comment`. On success, `data` carries the BoC and normalized hash of the broadcast transaction. Throws `Error('Wallet not connected')` if no wallet is currently selected — TanStack Query surfaces it via the mutation's `error`.
 *
 * @param parameters - {@link UseTransferJettonParameters} TanStack Query mutation overrides.
 * @expand parameters
 * @returns Mutation result for the jetton transfer call.
 *
 * @sample docs/examples/src/appkit/hooks/jettons#USE_TRANSFER_JETTON
 *
 * @public
 * @category Hook
 * @section Jettons
 */
export const useTransferJetton = <context = unknown>(
    parameters: UseTransferJettonParameters<context> = {},
): UseTransferJettonReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(transferJettonMutationOptions(appKit, parameters));
};
