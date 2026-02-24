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
    TransferTonData,
    TransferTonErrorType,
    TransferTonOptions,
    TransferTonVariables,
} from '@ton/appkit/queries';
import { transferTonMutationOptions } from '@ton/appkit/queries';

import { useMutation } from '../../../libs/query';
import type { UseMutationReturnType } from '../../../libs/query';
import { useAppKit } from '../../../hooks/use-app-kit';

export type UseTransferTonParameters<context = unknown> = TransferTonOptions<context>;

export type UseTransferTonReturnType<context = unknown> = UseMutationReturnType<
    TransferTonData,
    TransferTonErrorType,
    TransferTonVariables,
    context,
    (
        variables: TransferTonVariables,
        options?: MutateOptions<TransferTonData, TransferTonErrorType, TransferTonVariables, context>,
    ) => void,
    MutateFunction<TransferTonData, TransferTonErrorType, TransferTonVariables, context>
>;

export const useTransferTon = <context = unknown>(
    parameters: UseTransferTonParameters<context> = {},
): UseTransferTonReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(transferTonMutationOptions(appKit, parameters));
};
