/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import { transferTon } from '@ton/appkit';
import type { TransferTonParameters, TransferTonReturnType } from '@ton/appkit';

import { useMutation } from '../../../libs/query';
import type { UseMutationParameters, UseMutationReturnType } from '../../../libs/query';
import { useAppKit } from '../../../hooks/use-app-kit';

export type UseTransferTonParameters<context = unknown> = UseMutationParameters<
    TransferTonReturnType,
    Error,
    TransferTonParameters,
    context
>;

export type UseTransferTonReturnType<context = unknown> = UseMutationReturnType<
    TransferTonReturnType,
    Error,
    TransferTonParameters,
    context,
    (
        variables: TransferTonParameters,
        options?: MutateOptions<TransferTonReturnType, Error, TransferTonParameters, context>,
    ) => void,
    MutateFunction<TransferTonReturnType, Error, TransferTonParameters, context>
>;

export function useTransferTon<context = unknown>(
    parameters?: UseTransferTonParameters<context>,
): UseTransferTonReturnType<context> {
    const appKit = useAppKit();

    return useMutation({
        mutationFn: (variables) => transferTon(appKit, variables),
        ...parameters,
    });
}
