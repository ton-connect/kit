/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import type { TransferNftData, TransferNftErrorType, TransferNftOptions, TransferNftVariables } from '@ton/appkit';
import { transferNftMutationOptions } from '@ton/appkit';

import { useMutation } from '../../../libs/query';
import type { UseMutationReturnType } from '../../../libs/query';
import { useAppKit } from '../../../hooks/use-app-kit';

export type UseTransferNftParameters<context = unknown> = TransferNftOptions<context>;

export type UseTransferNftReturnType<context = unknown> = UseMutationReturnType<
    TransferNftData,
    TransferNftErrorType,
    TransferNftVariables,
    context,
    (
        variables: TransferNftVariables,
        options?: MutateOptions<TransferNftData, TransferNftErrorType, TransferNftVariables, context>,
    ) => void,
    MutateFunction<TransferNftData, TransferNftErrorType, TransferNftVariables, context>
>;

export const useTransferNft = <context = unknown>(
    parameters: UseTransferNftParameters<context> = {},
): UseTransferNftReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(transferNftMutationOptions(appKit, parameters));
};
