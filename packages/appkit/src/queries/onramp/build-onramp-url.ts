/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutationOptions } from '@tanstack/query-core';

import type { AppKit } from '../../core/app-kit';
import { buildOnrampUrl } from '../../actions/onramp/build-onramp-url';
import type { BuildOnrampUrlOptions, BuildOnrampUrlReturnType } from '../../actions/onramp/build-onramp-url';
import type { MutationParameter } from '../../types/query';

export type BuildOnrampUrlErrorType = Error;
export type BuildOnrampUrlData = Awaited<BuildOnrampUrlReturnType>;
export type BuildOnrampUrlVariables = BuildOnrampUrlOptions;
export type BuildOnrampUrlMutationOptions<context = unknown> = MutationParameter<
    BuildOnrampUrlData,
    BuildOnrampUrlErrorType,
    BuildOnrampUrlVariables,
    context
>;

export type BuildOnrampUrlMutationConfig<context = unknown> = MutationOptions<
    BuildOnrampUrlData,
    BuildOnrampUrlErrorType,
    BuildOnrampUrlVariables,
    context
>;

export const buildOnrampUrlMutationOptions = <context = unknown>(
    appKit: AppKit,
): BuildOnrampUrlMutationConfig<context> => ({
    mutationFn: (variables: BuildOnrampUrlVariables) => buildOnrampUrl(appKit, variables),
});
