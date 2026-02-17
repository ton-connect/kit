/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { UseMutationResult } from '@tanstack/react-query';
import type { BuildSwapTransactionData, BuildSwapTransactionErrorType, BuildSwapTransactionMutationOptions, BuildSwapTransactionVariables } from '@ton/appkit/queries';
export type UseBuildSwapTransactionParameters<context = unknown> = BuildSwapTransactionMutationOptions<context>;
export type UseBuildSwapTransactionReturnType<context = unknown> = UseMutationResult<BuildSwapTransactionData, BuildSwapTransactionErrorType, BuildSwapTransactionVariables, context>;
export declare const useBuildSwapTransaction: <context = unknown>(parameters?: UseBuildSwapTransactionParameters<context>) => UseBuildSwapTransactionReturnType<context>;
//# sourceMappingURL=use-build-swap-transaction.d.ts.map