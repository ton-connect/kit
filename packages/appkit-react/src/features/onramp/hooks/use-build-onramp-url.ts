/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import type { UseMutationResult } from '@tanstack/react-query';
import { buildOnrampUrlMutationOptions } from '@ton/appkit/queries';
import type {
    BuildOnrampUrlData,
    BuildOnrampUrlErrorType,
    BuildOnrampUrlMutationOptions,
    BuildOnrampUrlVariables,
} from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useMutation } from '../../../libs/query';

export type UseBuildOnrampUrlParameters<context = unknown> = BuildOnrampUrlMutationOptions<context>;

export type UseBuildOnrampUrlReturnType<context = unknown> = UseMutationResult<
    BuildOnrampUrlData,
    BuildOnrampUrlErrorType,
    BuildOnrampUrlVariables,
    context
>;

/**
 * Hook to build onramp URL
 */
export const useBuildOnrampUrl = <context = unknown>(
    parameters: UseBuildOnrampUrlParameters<context> = {},
): UseBuildOnrampUrlReturnType<context> => {
    const appKit = useAppKit();

    return useMutation({
        ...buildOnrampUrlMutationOptions<context>(appKit),
        ...parameters.mutation,
    });
};
