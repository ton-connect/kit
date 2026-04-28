/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutateOptions, MutationOptions } from '@tanstack/query-core';

import { signMessage } from '../../actions/transaction/sign-message';
import type {
    SignMessageErrorType,
    SignMessageParameters,
    SignMessageReturnType,
} from '../../actions/transaction/sign-message';
import type { AppKit } from '../../core/app-kit';
import type { MutationParameter } from '../../types/query';
import type { Compute } from '../../types/utils';

export type { SignMessageErrorType, SignMessageParameters, SignMessageReturnType };

export type SignMessageOptions<context = unknown> = MutationParameter<
    SignMessageData,
    SignMessageErrorType,
    SignMessageVariables,
    context
>;

export const signMessageMutationOptions = <context = unknown>(
    appKit: AppKit,
    options: SignMessageOptions<context> = {},
): SignMessageMutationOptions<context> => {
    return {
        ...options.mutation,
        mutationFn(variables) {
            return signMessage(appKit, variables);
        },
        mutationKey: ['signMessage'],
    };
};

export type SignMessageMutationOptions<context = unknown> = MutationOptions<
    SignMessageData,
    SignMessageErrorType,
    SignMessageVariables,
    context
>;

export type SignMessageData = Compute<SignMessageReturnType>;

export type SignMessageVariables = SignMessageParameters;

export type SignMessageMutate<context = unknown> = (
    variables: SignMessageVariables,
    options?:
        | Compute<MutateOptions<SignMessageData, SignMessageErrorType, Compute<SignMessageVariables>, context>>
        | undefined,
) => void;

export type SignMessageMutateAsync<context = unknown> = (
    variables: SignMessageVariables,
    options?:
        | Compute<MutateOptions<SignMessageData, SignMessageErrorType, Compute<SignMessageVariables>, context>>
        | undefined,
) => Promise<SignMessageData>;
