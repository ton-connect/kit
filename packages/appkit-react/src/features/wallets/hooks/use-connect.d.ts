/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import type { ConnectData, ConnectErrorType, ConnectOptions, ConnectVariables } from '@ton/appkit/queries';
import type { UseMutationReturnType } from '../../../libs/query';
export type UseConnectParameters<context = unknown> = ConnectOptions<context>;
export type UseConnectReturnType<context = unknown> = UseMutationReturnType<ConnectData, ConnectErrorType, ConnectVariables, context, (variables: ConnectVariables, options?: MutateOptions<ConnectData, ConnectErrorType, ConnectVariables, context>) => void, MutateFunction<ConnectData, ConnectErrorType, ConnectVariables, context>>;
export declare const useConnect: <context = unknown>(parameters?: UseConnectParameters<context>) => UseConnectReturnType<context>;
//# sourceMappingURL=use-connect.d.ts.map