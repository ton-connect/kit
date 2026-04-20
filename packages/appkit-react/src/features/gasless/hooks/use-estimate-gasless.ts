/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import { estimateGaslessMutationOptions } from '@ton/appkit/queries';
import type {
    EstimateGaslessData,
    EstimateGaslessErrorType,
    EstimateGaslessMutationConfig,
    EstimateGaslessVariables,
} from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useMutation } from '../../../libs/query';
import type { UseMutationReturnType } from '../../../libs/query';

export type UseEstimateGaslessParameters<context = unknown> = EstimateGaslessMutationConfig<context>;

export type UseEstimateGaslessReturnType<context = unknown> = UseMutationReturnType<
    EstimateGaslessData,
    EstimateGaslessErrorType,
    EstimateGaslessVariables,
    context,
    (
        variables: EstimateGaslessVariables,
        options?: MutateOptions<EstimateGaslessData, EstimateGaslessErrorType, EstimateGaslessVariables, context>,
    ) => void,
    MutateFunction<EstimateGaslessData, EstimateGaslessErrorType, EstimateGaslessVariables, context>
>;

/**
 * Hook to estimate gasless transaction.
 */
export const useEstimateGasless = <context = unknown>(
    parameters: UseEstimateGaslessParameters<context> = {},
): UseEstimateGaslessReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(estimateGaslessMutationOptions<context>(appKit, parameters));
};
