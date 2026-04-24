/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GaslessConfig } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export interface GetGaslessConfigOptions {
    /** Gasless provider id. Uses the default provider when omitted. */
    providerId?: string;
}

export type GetGaslessConfigReturnType = Promise<GaslessConfig>;

export type GetGaslessConfigErrorType = Error;

/**
 * Fetch gasless relayer configuration.
 *
 * Returns the relay address and jettons accepted by the relayer as fee payment.
 */
export const getGaslessConfig = async (
    appKit: AppKit,
    options: GetGaslessConfigOptions = {},
): GetGaslessConfigReturnType => {
    return appKit.gaslessManager.getConfig(options.providerId);
};
