/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import { disconnectMutationOptions } from '@ton/appkit/queries';
import type { DisconnectData, DisconnectErrorType, DisconnectOptions, DisconnectVariables } from '@ton/appkit/queries';

import { useMutation } from '../../../libs/query';
import type { UseMutationReturnType } from '../../../libs/query';
import { useAppKit } from '../../../hooks/use-app-kit';

export type UseDisconnectParameters<context = unknown> = DisconnectOptions<context>;

export type UseDisconnectReturnType<context = unknown> = UseMutationReturnType<
    DisconnectData,
    DisconnectErrorType,
    DisconnectVariables,
    context,
    (
        variables: DisconnectVariables,
        options?: MutateOptions<DisconnectData, DisconnectErrorType, DisconnectVariables, context>,
    ) => void,
    MutateFunction<DisconnectData, DisconnectErrorType, DisconnectVariables, context>
>;

export const useDisconnect = <context = unknown>(
    parameters: UseDisconnectParameters<context> = {},
): UseDisconnectReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(disconnectMutationOptions(appKit, parameters));
};
