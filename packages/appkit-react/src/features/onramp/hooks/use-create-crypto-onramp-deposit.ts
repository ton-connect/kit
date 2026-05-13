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

/**
 * Parameters accepted by {@link useCreateCryptoOnrampDeposit} — TanStack Query mutation options forwarded via `parameters.mutation`.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type UseCreateCryptoOnrampDepositParameters<context = unknown> =
    CreateCryptoOnrampDepositMutationOptions<context>;

/**
 * Return type of {@link useCreateCryptoOnrampDeposit} — TanStack Query mutation result.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type UseCreateCryptoOnrampDepositReturnType<context = unknown> = UseMutationResult<
    CreateCryptoOnrampDepositData,
    CreateCryptoOnrampDepositErrorType,
    CreateCryptoOnrampDepositVariables,
    context
>;

/**
 * Create a crypto-onramp deposit from a quote previously obtained via {@link useCryptoOnrampQuote}. Call `mutate(options)` where `options` matches {@link appkit:CreateCryptoOnrampDepositOptions} (quote, refund address, optional provider override); on success, `data` is the {@link appkit:CryptoOnrampDeposit} carrying the address and amount the user must send on the source chain to complete the onramp. Pair with {@link useCryptoOnrampStatus} to poll the deposit until it settles.
 *
 * @param parameters - {@link UseCreateCryptoOnrampDepositParameters} TanStack Query mutation overrides (`parameters.mutation`).
 * @returns Mutation result for the deposit call.
 *
 * @public
 * @category Hook
 * @section Crypto Onramp
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
