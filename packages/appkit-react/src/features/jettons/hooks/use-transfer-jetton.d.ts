/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import type { TransferJettonData, TransferJettonErrorType, TransferJettonOptions, TransferJettonVariables } from '@ton/appkit/queries';
import type { UseMutationReturnType } from '../../../libs/query';
export type UseTransferJettonParameters<context = unknown> = TransferJettonOptions<context>;
export type UseTransferJettonReturnType<context = unknown> = UseMutationReturnType<TransferJettonData, TransferJettonErrorType, TransferJettonVariables, context, (variables: TransferJettonVariables, options?: MutateOptions<TransferJettonData, TransferJettonErrorType, TransferJettonVariables, context>) => void, MutateFunction<TransferJettonData, TransferJettonErrorType, TransferJettonVariables, context>>;
export declare const useTransferJetton: <context = unknown>(parameters?: UseTransferJettonParameters<context>) => UseTransferJettonReturnType<context>;
//# sourceMappingURL=use-transfer-jetton.d.ts.map