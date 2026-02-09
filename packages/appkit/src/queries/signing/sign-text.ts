/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutateOptions, MutationOptions } from '@tanstack/query-core';

import { signText } from '../../actions/signing/sign-text';
import type { SignTextParameters, SignTextReturnType } from '../../actions/signing/sign-text';
import type { AppKit } from '../../core/app-kit';
import type { MutationParameter } from '../../types/query';
import type { Compute } from '../../types/utils';

export type SignTextErrorType = Error;

export type SignTextOptions<context = unknown> = MutationParameter<
    SignTextData,
    SignTextErrorType,
    SignTextVariables,
    context
>;

export const signTextMutationOptions = <context = unknown>(
    appKit: AppKit,
    options: SignTextOptions<context> = {},
): SignTextMutationOptions<context> => {
    return {
        ...options.mutation,
        mutationFn(variables) {
            return signText(appKit, variables);
        },
        mutationKey: ['signText'],
    };
};

export type SignTextMutationOptions<context = unknown> = MutationOptions<
    SignTextData,
    SignTextErrorType,
    SignTextVariables,
    context
>;

export type SignTextData = Compute<SignTextReturnType>;

export type SignTextVariables = SignTextParameters;

export type SignTextMutate<context = unknown> = (
    variables: SignTextVariables,
    options?: Compute<MutateOptions<SignTextData, SignTextErrorType, Compute<SignTextVariables>, context>> | undefined,
) => void;

export type SignTextMutateAsync<context = unknown> = (
    variables: SignTextVariables,
    options?: Compute<MutateOptions<SignTextData, SignTextErrorType, Compute<SignTextVariables>, context>> | undefined,
) => Promise<SignTextData>;
