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
 * Ask the selected wallet to sign a plain-text message — useful for off-chain login proofs and signed challenges. Call `mutate` from an event handler with the `text` to sign and an optional `network` override. On success, `data` carries the signature plus the canonicalized signer address, timestamp and dApp domain the wallet bound to the signature. Throws `Error('Wallet not connected')` if no wallet is currently selected — TanStack Query surfaces it via the mutation's `error`.
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
