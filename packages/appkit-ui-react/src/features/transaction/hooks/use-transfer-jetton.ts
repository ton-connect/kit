/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import { transferJetton } from '@ton/appkit';
import type { TransferJettonParameters, TransferJettonReturnType } from '@ton/appkit';

import { useMutation } from '../../../libs/query';
import type { UseMutationParameters, UseMutationReturnType } from '../../../libs/query';
import { useAppKit } from '../../../hooks/use-app-kit';

export type UseTransferJettonParameters<context = unknown> = UseMutationParameters<
    TransferJettonReturnType,
    Error,
    TransferJettonParameters,
    context
>;

export type UseTransferJettonReturnType<context = unknown> = UseMutationReturnType<
    TransferJettonReturnType,
    Error,
    TransferJettonParameters,
    context,
    (
        variables: TransferJettonParameters,
        options?: MutateOptions<TransferJettonReturnType, Error, TransferJettonParameters, context>,
    ) => void,
    MutateFunction<TransferJettonReturnType, Error, TransferJettonParameters, context>
>;

export const useTransferJetton = <context = unknown>(
    parameters?: UseTransferJettonParameters<context>,
): UseTransferJettonReturnType<context> => {
    const appKit = useAppKit();

    return useMutation({
        mutationFn: (variables) => transferJetton(appKit, variables),
        ...parameters,
    });
};
