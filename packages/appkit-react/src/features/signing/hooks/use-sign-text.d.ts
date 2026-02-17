/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { UseMutationResult } from '@tanstack/react-query';
import type { SignTextData, SignTextErrorType, SignTextOptions, SignTextVariables } from '@ton/appkit/queries';
export type UseSignTextParameters<context = unknown> = SignTextOptions<context>;
export type UseSignTextReturnType<context = unknown> = UseMutationResult<SignTextData, SignTextErrorType, SignTextVariables, context>;
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
export declare const useSignText: <context = unknown>(parameters?: UseSignTextParameters<context>) => UseSignTextReturnType<context>;
//# sourceMappingURL=use-sign-text.d.ts.map