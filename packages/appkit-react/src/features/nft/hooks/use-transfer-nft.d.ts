/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import type { TransferNftData, TransferNftErrorType, TransferNftOptions, TransferNftVariables } from '@ton/appkit/queries';
import type { UseMutationReturnType } from '../../../libs/query';
export type UseTransferNftParameters<context = unknown> = TransferNftOptions<context>;
export type UseTransferNftReturnType<context = unknown> = UseMutationReturnType<TransferNftData, TransferNftErrorType, TransferNftVariables, context, (variables: TransferNftVariables, options?: MutateOptions<TransferNftData, TransferNftErrorType, TransferNftVariables, context>) => void, MutateFunction<TransferNftData, TransferNftErrorType, TransferNftVariables, context>>;
export declare const useTransferNft: <context = unknown>(parameters?: UseTransferNftParameters<context>) => UseTransferNftReturnType<context>;
//# sourceMappingURL=use-transfer-nft.d.ts.map