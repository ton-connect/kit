/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';

export interface WatchCryptoOnrampProvidersParameters {
    onChange: () => void;
}

export type WatchCryptoOnrampProvidersReturnType = () => void;

/**
 * Watch for new crypto-onramp providers registration and default-provider changes.
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
