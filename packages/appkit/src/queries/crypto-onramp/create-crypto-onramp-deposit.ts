/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutationOptions } from '@tanstack/query-core';

import type { AppKit } from '../../core/app-kit';
import { createCryptoOnrampDeposit } from '../../actions/crypto-onramp/create-crypto-onramp-deposit';
import type {
    CreateCryptoOnrampDepositOptions,
    CreateCryptoOnrampDepositReturnType,
} from '../../actions/crypto-onramp/create-crypto-onramp-deposit';
import type { MutationParameter } from '../../types/query';

export type CreateCryptoOnrampDepositErrorType = Error;
export type CreateCryptoOnrampDepositData = Awaited<CreateCryptoOnrampDepositReturnType>;
export type CreateCryptoOnrampDepositVariables = CreateCryptoOnrampDepositOptions;
export type CreateCryptoOnrampDepositMutationOptions<context = unknown> = MutationParameter<
    CreateCryptoOnrampDepositData,
    CreateCryptoOnrampDepositErrorType,
    CreateCryptoOnrampDepositVariables,
    context
>;

export type CreateCryptoOnrampDepositMutationConfig<context = unknown> = MutationOptions<
    CreateCryptoOnrampDepositData,
    CreateCryptoOnrampDepositErrorType,
    CreateCryptoOnrampDepositVariables,
    context
>;

export const createCryptoOnrampDepositMutationOptions = <context = unknown>(
    appKit: AppKit,
): CreateCryptoOnrampDepositMutationConfig<context> => ({
    mutationFn: (variables: CreateCryptoOnrampDepositVariables) => createCryptoOnrampDeposit(appKit, variables),
});
