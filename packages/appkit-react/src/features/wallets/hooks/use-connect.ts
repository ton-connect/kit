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
import { useAppKit } from '../../settings';

/**
 * Parameters accepted by {@link useConnect} — TanStack Query mutation options (`onSuccess`, `onError`, `onMutate`, `retry`, …).
 *
 * @public
 * @category Type
 * @section Wallets
 */
export type UseConnectParameters<context = unknown> = ConnectOptions<context>;

/**
 * Return type of {@link useConnect} — TanStack Query mutation result with `mutate`/`mutateAsync` and the standard companions.
 *
 * @public
 * @category Type
 * @section Wallets
 */
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

/**
 * Open a registered connector's connection flow (e.g., the TonConnect modal) and await its completion. Call `mutate` from a Connect button with the `connectorId` of the connector to drive; once the user finishes the flow the new wallet becomes available via {@link useSelectedWallet} / {@link useConnectedWallets}. Throws `Error('Connector with id "<id>" not found')` when no connector with that id is registered — TanStack Query surfaces it via the mutation's `error`.
 *
 * @param parameters - {@link UseConnectParameters} TanStack Query mutation overrides.
 * @returns Mutation result for the connect call.
 *
 * @public
 * @category Hook
 * @section Wallets
 */
export const useConnect = <context = unknown>(
    parameters: UseConnectParameters<context> = {},
): UseConnectReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(connectMutationOptions(appKit, parameters));
};
