/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import type { UseMutationResult } from '@tanstack/react-query';
import { createCryptoOnrampDepositMutationOptions } from '@ton/appkit/queries';
import type {
    CreateCryptoOnrampDepositData,
    CreateCryptoOnrampDepositErrorType,
    CreateCryptoOnrampDepositMutationOptions,
    CreateCryptoOnrampDepositVariables,
} from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useMutation } from '../../../libs/query';

export type UseCreateCryptoOnrampDepositParameters<context = unknown> =
    CreateCryptoOnrampDepositMutationOptions<context>;

export type UseCreateCryptoOnrampDepositReturnType<context = unknown> = UseMutationResult<
    CreateCryptoOnrampDepositData,
    CreateCryptoOnrampDepositErrorType,
    CreateCryptoOnrampDepositVariables,
    context
>;

/**
 * Hook to create a crypto onramp deposit from a previously obtained quote
 */
export const useCreateCryptoOnrampDeposit = <context = unknown>(
    parameters: UseCreateCryptoOnrampDepositParameters<context> = {},
): UseCreateCryptoOnrampDepositReturnType<context> => {
    const appKit = useAppKit();

    return useMutation({
        ...createCryptoOnrampDepositMutationOptions<context>(appKit),
        ...parameters.mutation,
    });
};
