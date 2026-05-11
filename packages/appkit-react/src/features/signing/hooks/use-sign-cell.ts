/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UseMutationResult } from '@tanstack/react-query';
import { signCellMutationOptions } from '@ton/appkit/queries';
import type { SignCellData, SignCellErrorType, SignCellOptions, SignCellVariables } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useMutation } from '../../../libs/query';

/**
 * Parameters accepted by {@link useSignCell} — TanStack Query mutation options.
 *
 * @public
 * @category Type
 * @section Signing
 */
export type UseSignCellParameters<context = unknown> = SignCellOptions<context>;

/**
 * Return type of {@link useSignCell} — TanStack Query mutation result.
 *
 * @public
 * @category Type
 * @section Signing
 */
export type UseSignCellReturnType<context = unknown> = UseMutationResult<
    SignCellData,
    SignCellErrorType,
    SignCellVariables,
    context
>;

/**
 * React mutation hook that asks the selected wallet to sign a TON cell (wraps {@link signCell}); typically used so the signature can later be verified on-chain. Returns `mutate({ cell, schema })` you call from event handlers. The underlying action throws `Error('Wallet not connected')` if no wallet is currently selected — TanStack Query surfaces it via the mutation's `error`.
 *
 * @param parameters - {@link UseSignCellParameters} TanStack Query mutation overrides.
 * @returns Mutation result for the signing call.
 *
 * @public
 * @category Hook
 * @section Signing
 */
export const useSignCell = <context = unknown>(
    parameters?: UseSignCellParameters<context>,
): UseSignCellReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(signCellMutationOptions(appKit, parameters));
};
