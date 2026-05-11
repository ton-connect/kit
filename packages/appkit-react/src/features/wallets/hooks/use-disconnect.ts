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
import { useAppKit } from '../../settings';

/**
 * Parameters accepted by {@link useDisconnect} — TanStack Query mutation options.
 *
 * @public
 * @category Type
 * @section Wallets
 */
export type UseDisconnectParameters<context = unknown> = DisconnectOptions<context>;

/**
 * Return type of {@link useDisconnect} — TanStack Query mutation result.
 *
 * @public
 * @category Type
 * @section Wallets
 */
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

/**
 * React mutation hook that disconnects the wallet currently connected through a registered connector (wraps {@link appkit:disconnect}); returns `mutate({ connectorId })` you call from event handlers. The underlying action throws `Error('Connector with id "<id>" not found')` when no connector with that id is registered — TanStack Query surfaces it via the mutation's `error`.
 *
 * @param parameters - {@link UseDisconnectParameters} TanStack Query mutation overrides.
 * @returns Mutation result for the disconnect call.
 *
 * @public
 * @category Hook
 * @section Wallets
 */
export const useDisconnect = <context = unknown>(
    parameters: UseDisconnectParameters<context> = {},
): UseDisconnectReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(disconnectMutationOptions(appKit, parameters));
};
