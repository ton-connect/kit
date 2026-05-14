/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';

/**
 * Parameters accepted by {@link watchCryptoOnrampProviders}.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export interface WatchCryptoOnrampProvidersParameters {
    /** Callback fired whenever a crypto-onramp provider is registered or the default crypto-onramp provider changes. */
    onChange: () => void;
}

/**
 * Return type of {@link watchCryptoOnrampProviders} — call to stop receiving updates.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type WatchCryptoOnrampProvidersReturnType = () => void;

/**
 * Subscribe to crypto-onramp provider lifecycle — fires `onChange` whenever a new provider is registered or the default crypto-onramp provider switches.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link WatchCryptoOnrampProvidersParameters} Update callback.
 * @returns Unsubscribe function — call it to stop receiving updates.
 *
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Crypto Onramp
 */
export const watchCryptoOnrampProviders = (
    appKit: AppKit,
    parameters: WatchCryptoOnrampProvidersParameters,
): WatchCryptoOnrampProvidersReturnType => {
    const { onChange } = parameters;

    const unsubscribeRegistered = appKit.emitter.on('provider:registered', (event) => {
        if (event.payload.type === 'crypto-onramp') onChange();
    });

    const unsubscribeDefaultChanged = appKit.emitter.on('provider:default-changed', (event) => {
        if (event.payload.type === 'crypto-onramp') onChange();
    });

    return () => {
        unsubscribeRegistered();
        unsubscribeDefaultChanged();
    };
};
