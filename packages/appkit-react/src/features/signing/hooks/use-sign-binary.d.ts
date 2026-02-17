/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { UseMutationResult } from '@tanstack/react-query';
import type { SignBinaryData, SignBinaryErrorType, SignBinaryOptions, SignBinaryVariables } from '@ton/appkit/queries';
export type UseSignBinaryParameters<context = unknown> = SignBinaryOptions<context>;
export type UseSignBinaryReturnType<context = unknown> = UseMutationResult<SignBinaryData, SignBinaryErrorType, SignBinaryVariables, context>;
/**
 * Hook to sign binary data with the connected wallet.
 *
 * @example
 * ```tsx
 * const { mutate: signBinary, isPending } = useSignBinary();
 *
 * const handleSign = () => {
 *   signBinary({ bytes: btoa("binary data") });
 * };
 * ```
 */
export declare const useSignBinary: <context = unknown>(parameters?: UseSignBinaryParameters<context>) => UseSignBinaryReturnType<context>;
//# sourceMappingURL=use-sign-binary.d.ts.map