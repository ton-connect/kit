/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import { transferNft } from '@ton/appkit';
import type { TransferNftParameters, TransferNftReturnType } from '@ton/appkit';

import { useMutation } from '../../../libs/query';
import type { UseMutationParameters, UseMutationReturnType } from '../../../libs/query';
import { useAppKit } from '../../../hooks/use-app-kit';

export type UseTransferNftParameters<context = unknown> = UseMutationParameters<
    TransferNftReturnType,
    Error,
    TransferNftParameters,
    context
>;

export type UseTransferNftReturnType<context = unknown> = UseMutationReturnType<
    TransferNftReturnType,
    Error,
    TransferNftParameters,
    context,
    (
        variables: TransferNftParameters,
        options?: MutateOptions<TransferNftReturnType, Error, TransferNftParameters, context>,
    ) => void,
    MutateFunction<TransferNftReturnType, Error, TransferNftParameters, context>
>;

export const useTransferNft = <context = unknown>(
    parameters?: UseTransferNftParameters<context>,
): UseTransferNftReturnType<context> => {
    const appKit = useAppKit();

    return useMutation({
        mutationFn: (variables) => transferNft(appKit, variables),
        ...parameters,
    });
};
