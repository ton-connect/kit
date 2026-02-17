/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import type { SendTransactionData, SendTransactionErrorType, SendTransactionOptions, SendTransactionVariables } from '@ton/appkit/queries';
import type { UseMutationReturnType } from '../../../libs/query';
export type UseSendTransactionParameters<context = unknown> = SendTransactionOptions<context>;
export type UseSendTransactionReturnType<context = unknown> = UseMutationReturnType<SendTransactionData, SendTransactionErrorType, SendTransactionVariables, context, (variables: SendTransactionVariables, options?: MutateOptions<SendTransactionData, SendTransactionErrorType, SendTransactionVariables, context>) => void, MutateFunction<SendTransactionData, SendTransactionErrorType, SendTransactionVariables, context>>;
export declare const useSendTransaction: <context = unknown>(parameters?: UseSendTransactionParameters<context>) => UseSendTransactionReturnType<context>;
//# sourceMappingURL=use-send-transaction.d.ts.map