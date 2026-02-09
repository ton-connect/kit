/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UseMutationResult } from '@tanstack/react-query';
import { signTextMutationOptions } from '@ton/appkit';
import type { SignTextData, SignTextErrorType, SignTextOptions, SignTextVariables } from '@ton/appkit';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useMutation } from '../../../libs/query';

export type UseSignTextParameters<context = unknown> = SignTextOptions<context>;

export type UseSignTextReturnType<context = unknown> = UseMutationResult<
    SignTextData,
    SignTextErrorType,
    SignTextVariables,
    context
>;

/**
 * Hook to sign text messages with the connected wallet.
 *
 * @example
 * ```tsx
 * const { mutate: signText, isPending } = useSignText();
 *
 * const handleSign = () => {
 *   signText({ text: "Hello World" });
 * };
 * ```
 */
export const useSignText = <context = unknown>(
    parameters?: UseSignTextParameters<context>,
): UseSignTextReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(signTextMutationOptions(appKit, parameters));
};
