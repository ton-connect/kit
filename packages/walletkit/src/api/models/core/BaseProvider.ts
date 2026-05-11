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
    /** Fired by a DeFi manager when a provider is registered through it (carries the provider's id and kind). */
    'provider:registered': BaseProviderUpdate;
    /** Fired by a DeFi manager when its default provider is set or cleared (carries the new default's id and kind). */
    'provider:default-changed': BaseProviderUpdate;
}
