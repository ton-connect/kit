/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UseMutationResult } from '@tanstack/react-query';
import { signBinaryMutationOptions } from '@ton/appkit/queries';
import type { SignBinaryData, SignBinaryErrorType, SignBinaryOptions, SignBinaryVariables } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useMutation } from '../../../libs/query';

/**
 * Parameters accepted by {@link useSignBinary} — TanStack Query mutation options.
 *
 * @public
 * @category Type
 * @section Signing
 */
export type UseSignBinaryParameters<context = unknown> = SignBinaryOptions<context>;

/**
 * Return type of {@link useSignBinary} — TanStack Query mutation result.
 *
 * @public
 * @category Type
 * @section Signing
 */
export type UseSignBinaryReturnType<context = unknown> = UseMutationResult<
    SignBinaryData,
    SignBinaryErrorType,
    SignBinaryVariables,
    context
>;

/**
 * React mutation hook that asks the selected wallet to sign a binary blob (wraps {@link appkit:signBinary}); returns `mutate({ bytes })` you call from event handlers. The underlying action throws `Error('Wallet not connected')` if no wallet is currently selected — TanStack Query surfaces it via the mutation's `error`.
 *
 * @param parameters - {@link UseSignBinaryParameters} TanStack Query mutation overrides.
 * @returns Mutation result for the signing call.
 *
 * @public
 * @category Hook
 * @section Signing
 */
export const useSignBinary = <context = unknown>(
    parameters?: UseSignBinaryParameters<context>,
): UseSignBinaryReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(signBinaryMutationOptions(appKit, parameters));
};
