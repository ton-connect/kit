/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import type { UseMutationResult, UseMutationOptions } from '@tanstack/react-query';
import { disconnectMutationOptions } from '@ton/appkit/queries';
import type { DisconnectParameters, DisconnectReturnType } from '@ton/appkit';

import { useMutation } from '../../../libs/query';
import { useAppKit } from '../../../hooks/use-app-kit';

export type UseDisconnectParameters = Omit<
    UseMutationOptions<DisconnectReturnType, Error, DisconnectParameters>,
    'mutationFn' | 'mutationKey'
>;

export type UseDisconnectReturnType = UseMutationResult<DisconnectReturnType, Error, DisconnectParameters> & {
    disconnect: UseMutationResult<DisconnectReturnType, Error, DisconnectParameters>['mutate'];
    disconnectAsync: UseMutationResult<DisconnectReturnType, Error, DisconnectParameters>['mutateAsync'];
};

export const useDisconnect = (parameters: UseDisconnectParameters = {}): UseDisconnectReturnType => {
    const appKit = useAppKit();
    const mutationOptions = disconnectMutationOptions(appKit);
    const mutation = useMutation({
        ...mutationOptions,
        ...parameters,
    });

    return {
        ...mutation,
        disconnect: mutation.mutate,
        disconnectAsync: mutation.mutateAsync,
    };
};
