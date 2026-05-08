/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Base interface shared by all provider types.
 */
export interface BaseProvider {
    /** Stable provider identifier, unique within the manager that registered it. */
    readonly providerId: string;
    /** Provider kind discriminator (e.g., `'swap'`, `'staking'`, `'onramp'`, `'crypto-onramp'`); used to route registrations to the right manager. */
    readonly type: string;
}

export interface BaseProviderUpdate {
    providerId: string;
    type: string;
}

export interface BaseProviderEvents {
    'provider:registered': BaseProviderUpdate;
    'provider:default-changed': BaseProviderUpdate;
}
