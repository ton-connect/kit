/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutateOptions, MutationOptions } from '@tanstack/query-core';

import { signBinary } from '../../actions/signing/sign-binary';
import type { SignBinaryParameters, SignBinaryReturnType } from '../../actions/signing/sign-binary';
import type { AppKit } from '../../core/app-kit';
import type { MutationParameter } from '../../types/query';
import type { Compute } from '../../types/utils';

export type SignBinaryErrorType = Error;

export type SignBinaryOptions<context = unknown> = MutationParameter<
    SignBinaryData,
    SignBinaryErrorType,
    SignBinaryVariables,
    context
>;

export const signBinaryMutationOptions = <context = unknown>(
    appKit: AppKit,
    options: SignBinaryOptions<context> = {},
): SignBinaryMutationOptions<context> => {
    return {
        ...options.mutation,
        mutationFn(variables) {
            return signBinary(appKit, variables);
        },
        mutationKey: ['signBinary'],
    };
};

export type SignBinaryMutationOptions<context = unknown> = MutationOptions<
    SignBinaryData,
    SignBinaryErrorType,
    SignBinaryVariables,
    context
>;

export type SignBinaryData = Compute<SignBinaryReturnType>;

export type SignBinaryVariables = SignBinaryParameters;

export type SignBinaryMutate<context = unknown> = (
    variables: SignBinaryVariables,
    options?:
        | Compute<MutateOptions<SignBinaryData, SignBinaryErrorType, Compute<SignBinaryVariables>, context>>
        | undefined,
) => void;

export type SignBinaryMutateAsync<context = unknown> = (
    variables: SignBinaryVariables,
    options?:
        | Compute<MutateOptions<SignBinaryData, SignBinaryErrorType, Compute<SignBinaryVariables>, context>>
        | undefined,
) => Promise<SignBinaryData>;
