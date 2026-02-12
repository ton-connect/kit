/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutateOptions, MutationOptions } from '@tanstack/query-core';

import type { AppKit } from '../../core/app-kit';
import { disconnect } from '../../actions/connectors/disconnect';
import type { DisconnectParameters, DisconnectReturnType } from '../../actions/connectors/disconnect';
import type { MutationParameter } from '../../types/query';
import type { Compute } from '../../types/utils';

export type { DisconnectParameters, DisconnectReturnType };

export type DisconnectErrorType = Error;

export type DisconnectOptions<context = unknown> = MutationParameter<
    DisconnectData,
    DisconnectErrorType,
    DisconnectVariables,
    context
>;

export const disconnectMutationOptions = <context = unknown>(
    appKit: AppKit,
    options: DisconnectOptions<context> = {},
): DisconnectMutationOptions<context> => {
    return {
        ...options.mutation,
        mutationFn(variables) {
            return disconnect(appKit, variables);
        },
        mutationKey: ['disconnect'],
    };
};

export type DisconnectMutationOptions<context = unknown> = MutationOptions<
    DisconnectData,
    DisconnectErrorType,
    DisconnectVariables,
    context
>;

export type DisconnectData = Compute<DisconnectReturnType>;

export type DisconnectVariables = DisconnectParameters;

export type DisconnectMutate<context = unknown> = (
    variables: DisconnectVariables,
    options?:
        | Compute<MutateOptions<DisconnectData, DisconnectErrorType, Compute<DisconnectVariables>, context>>
        | undefined,
) => void;

export type DisconnectMutateAsync<context = unknown> = (
    variables: DisconnectVariables,
    options?:
        | Compute<MutateOptions<DisconnectData, DisconnectErrorType, Compute<DisconnectVariables>, context>>
        | undefined,
) => Promise<DisconnectData>;
