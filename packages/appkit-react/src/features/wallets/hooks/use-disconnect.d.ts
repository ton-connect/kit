/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import type { DisconnectData, DisconnectErrorType, DisconnectOptions, DisconnectVariables } from '@ton/appkit/queries';
import type { UseMutationReturnType } from '../../../libs/query';
export type UseDisconnectParameters<context = unknown> = DisconnectOptions<context>;
export type UseDisconnectReturnType<context = unknown> = UseMutationReturnType<DisconnectData, DisconnectErrorType, DisconnectVariables, context, (variables: DisconnectVariables, options?: MutateOptions<DisconnectData, DisconnectErrorType, DisconnectVariables, context>) => void, MutateFunction<DisconnectData, DisconnectErrorType, DisconnectVariables, context>>;
export declare const useDisconnect: <context = unknown>(parameters?: UseDisconnectParameters<context>) => UseDisconnectReturnType<context>;
//# sourceMappingURL=use-disconnect.d.ts.map