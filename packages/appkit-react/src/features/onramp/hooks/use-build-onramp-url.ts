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
 * React mutation hook that wraps `buildOnrampUrl` — builds a URL that redirects the user to an onramp provider's flow. Returns `mutate(params)`. Internal: not part of the public API yet (fiat onramp is WIP).
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
