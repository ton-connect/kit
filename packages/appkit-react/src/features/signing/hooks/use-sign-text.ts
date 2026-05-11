/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UseMutationResult } from '@tanstack/react-query';
import { signTextMutationOptions } from '@ton/appkit/queries';
import type { SignTextData, SignTextErrorType, SignTextOptions, SignTextVariables } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useMutation } from '../../../libs/query';

/**
 * Parameters accepted by {@link useSignText} — TanStack Query mutation options.
 *
 * @public
 * @category Type
 * @section Signing
 */
export type UseSignTextParameters<context = unknown> = SignTextOptions<context>;

/**
 * Return type of {@link useSignText} — TanStack Query mutation result.
 *
 * @public
 * @category Type
 * @section Signing
 */
export type UseSignTextReturnType<context = unknown> = UseMutationResult<
    SignTextData,
    SignTextErrorType,
    SignTextVariables,
    context
>;

/**
 * React mutation hook that asks the selected wallet to sign a plain-text message (wraps {@link signText}); returns `mutate({ text })` you call from event handlers. The underlying action throws `Error('Wallet not connected')` if no wallet is currently selected — TanStack Query surfaces it via the mutation's `error`.
 *
 * @param parameters - {@link UseSignTextParameters} TanStack Query mutation overrides.
 * @returns Mutation result for the signing call.
 *
 * @public
 * @category Hook
 * @section Signing
 */
export const useSignText = <context = unknown>(
    parameters: UseSignTextParameters<context> = {},
): UseSignTextReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(signTextMutationOptions(appKit, parameters));
};
