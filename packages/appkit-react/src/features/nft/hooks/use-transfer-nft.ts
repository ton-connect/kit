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
    TransferNftData,
    TransferNftErrorType,
    TransferNftOptions,
    TransferNftVariables,
} from '@ton/appkit/queries';
import { transferNftMutationOptions } from '@ton/appkit/queries';

import { useMutation } from '../../../libs/query';
import type { UseMutationReturnType } from '../../../libs/query';
import { useAppKit } from '../../settings';

/**
 * Parameters accepted by {@link useTransferNft} — TanStack Query mutation options.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export type UseTransferNftParameters<context = unknown> = TransferNftOptions<context>;

/**
 * Return type of {@link useTransferNft} — TanStack Query mutation result.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export type UseTransferNftReturnType<context = unknown> = UseMutationReturnType<
    TransferNftData,
    TransferNftErrorType,
    TransferNftVariables,
    context,
    (
        variables: TransferNftVariables,
        options?: MutateOptions<TransferNftData, TransferNftErrorType, TransferNftVariables, context>,
    ) => void,
    MutateFunction<TransferNftData, TransferNftErrorType, TransferNftVariables, context>
>;

/**
 * Transfer an NFT from the selected wallet in one step — builds the ownership-transfer message and broadcasts it. Call `mutate` with an `nftAddress`, the `recipientAddress`, an optional `amount` (the TON attached for gas — defaults to AppKit's NFT gas-fee constant when omitted) and an optional `comment`. On success, `data` carries the BoC and normalized hash of the broadcast transaction. Throws `Error('Wallet not connected')` if no wallet is currently selected — TanStack Query surfaces it via the mutation's `error`.
 *
 * @param parameters - {@link UseTransferNftParameters} TanStack Query mutation overrides.
 * @expand parameters
 * @returns Mutation result for the transfer call.
 *
 * @sample docs/examples/src/appkit/hooks/nft#USE_TRANSFER_NFT
 *
 * @public
 * @category Hook
 * @section NFTs
 */
export const useTransferNft = <context = unknown>(
    parameters: UseTransferNftParameters<context> = {},
): UseTransferNftReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(transferNftMutationOptions(appKit, parameters));
};
