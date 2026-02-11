/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutateOptions, MutationOptions } from '@tanstack/query-core';

import type { AppKit } from '../../core/app-kit';
import { connect } from '../../actions/wallets/connect';
import type { ConnectParameters, ConnectReturnType } from '../../actions/wallets/connect';
import type { MutationParameter } from '../../types/query';
import type { Compute } from '../../types/utils';

export type { ConnectParameters, ConnectReturnType };

export type ConnectErrorType = Error;

export type ConnectOptions<context = unknown> = MutationParameter<
    ConnectData,
    ConnectErrorType,
    ConnectVariables,
    context
>;

export const connectMutationOptions = <context = unknown>(
    appKit: AppKit,
    options: ConnectOptions<context> = {},
): ConnectMutationOptions<context> => {
    return {
        ...options.mutation,
        mutationFn(variables) {
            return connect(appKit, variables);
        },
        mutationKey: ['connect'],
    };
};

export type ConnectMutationOptions<context = unknown> = MutationOptions<
    ConnectData,
    ConnectErrorType,
    ConnectVariables,
    context
>;

export type ConnectData = Compute<ConnectReturnType>;

export type ConnectVariables = ConnectParameters;

export type ConnectMutate<context = unknown> = (
    variables: ConnectVariables,
    options?: Compute<MutateOptions<ConnectData, ConnectErrorType, Compute<ConnectVariables>, context>> | undefined,
) => void;

export type ConnectMutateAsync<context = unknown> = (
    variables: ConnectVariables,
    options?: Compute<MutateOptions<ConnectData, ConnectErrorType, Compute<ConnectVariables>, context>> | undefined,
) => Promise<ConnectData>;
