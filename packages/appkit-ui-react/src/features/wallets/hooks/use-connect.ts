/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import { connectMutationOptions } from '@ton/appkit/queries';
import type { ConnectData, ConnectErrorType, ConnectOptions, ConnectVariables } from '@ton/appkit/queries';

import { useMutation } from '../../../libs/query';
import type { UseMutationReturnType } from '../../../libs/query';
import { useAppKit } from '../../../hooks/use-app-kit';

export type UseConnectParameters<context = unknown> = ConnectOptions<context>;

export type UseConnectReturnType<context = unknown> = UseMutationReturnType<
    ConnectData,
    ConnectErrorType,
    ConnectVariables,
    context,
    (
        variables: ConnectVariables,
        options?: MutateOptions<ConnectData, ConnectErrorType, ConnectVariables, context>,
    ) => void,
    MutateFunction<ConnectData, ConnectErrorType, ConnectVariables, context>
>;

export const useConnect = <context = unknown>(
    parameters: UseConnectParameters<context> = {},
): UseConnectReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(connectMutationOptions(appKit, parameters));
};
