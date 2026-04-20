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
    SignMessageData,
    SignMessageErrorType,
    SignMessageOptions,
    SignMessageVariables,
} from '@ton/appkit/queries';
import { signMessageMutationOptions } from '@ton/appkit/queries';

import { useMutation } from '../../../libs/query';
import type { UseMutationReturnType } from '../../../libs/query';
import { useAppKit } from '../../settings';

export type UseSignMessageParameters<context = unknown> = SignMessageOptions<context>;

export type UseSignMessageReturnType<context = unknown> = UseMutationReturnType<
    SignMessageData,
    SignMessageErrorType,
    SignMessageVariables,
    context,
    (
        variables: SignMessageVariables,
        options?: MutateOptions<SignMessageData, SignMessageErrorType, SignMessageVariables, context>,
    ) => void,
    MutateFunction<SignMessageData, SignMessageErrorType, SignMessageVariables, context>
>;

/**
 * Hook to sign a transaction-shaped request without broadcasting it.
 *
 * Returns a signed internal-message BoC that a third party can relay on-chain
 * (e.g. a gasless relayer).
 */
export const useSignMessage = <context = unknown>(
    parameters: UseSignMessageParameters<context> = {},
): UseSignMessageReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(signMessageMutationOptions(appKit, parameters));
};
