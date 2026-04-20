/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import { sendGaslessTransactionMutationOptions } from '@ton/appkit/queries';
import type {
    SendGaslessTransactionData,
    SendGaslessTransactionErrorType,
    SendGaslessTransactionMutationConfig,
    SendGaslessTransactionVariables,
} from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useMutation } from '../../../libs/query';
import type { UseMutationReturnType } from '../../../libs/query';

export type UseSendGaslessTransactionParameters<context = unknown> = SendGaslessTransactionMutationConfig<context>;

export type UseSendGaslessTransactionReturnType<context = unknown> = UseMutationReturnType<
    SendGaslessTransactionData,
    SendGaslessTransactionErrorType,
    SendGaslessTransactionVariables,
    context,
    (
        variables: SendGaslessTransactionVariables,
        options?: MutateOptions<
            SendGaslessTransactionData,
            SendGaslessTransactionErrorType,
            SendGaslessTransactionVariables,
            context
        >,
    ) => void,
    MutateFunction<
        SendGaslessTransactionData,
        SendGaslessTransactionErrorType,
        SendGaslessTransactionVariables,
        context
    >
>;

/**
 * Hook to send gasless transaction.
 */
export const useSendGaslessTransaction = <context = unknown>(
    parameters: UseSendGaslessTransactionParameters<context> = {},
): UseSendGaslessTransactionReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(sendGaslessTransactionMutationOptions<context>(appKit, parameters));
};
