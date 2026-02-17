/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { UseMutationResult } from '@tanstack/react-query';
import type { SignCellData, SignCellErrorType, SignCellOptions, SignCellVariables } from '@ton/appkit/queries';
export type UseSignCellParameters<context = unknown> = SignCellOptions<context>;
export type UseSignCellReturnType<context = unknown> = UseMutationResult<SignCellData, SignCellErrorType, SignCellVariables, context>;
/**
 * Hook to sign TON Cell data with the connected wallet.
 * Used for on-chain signature verification.
 *
 * @example
 * ```tsx
 * const { mutate: signCell, isPending } = useSignCell();
 *
 * const handleSign = () => {
 *   signCell({ cell: bocBase64, schema: "transfer#abc amount:uint64 = Transfer" });
 * };
 * ```
 */
export declare const useSignCell: <context = unknown>(parameters?: UseSignCellParameters<context>) => UseSignCellReturnType<context>;
//# sourceMappingURL=use-sign-cell.d.ts.map