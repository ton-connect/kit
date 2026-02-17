/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import type { TransferTonData, TransferTonErrorType, TransferTonOptions, TransferTonVariables } from '@ton/appkit/queries';
import type { UseMutationReturnType } from '../../../libs/query';
export type UseTransferTonParameters<context = unknown> = TransferTonOptions<context>;
export type UseTransferTonReturnType<context = unknown> = UseMutationReturnType<TransferTonData, TransferTonErrorType, TransferTonVariables, context, (variables: TransferTonVariables, options?: MutateOptions<TransferTonData, TransferTonErrorType, TransferTonVariables, context>) => void, MutateFunction<TransferTonData, TransferTonErrorType, TransferTonVariables, context>>;
export declare const useTransferTon: <context = unknown>(parameters?: UseTransferTonParameters<context>) => UseTransferTonReturnType<context>;
//# sourceMappingURL=use-transfer-ton.d.ts.map