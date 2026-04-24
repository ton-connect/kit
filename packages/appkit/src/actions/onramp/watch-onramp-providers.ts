/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';

export interface WatchOnrampProvidersParameters {
    onChange: () => void;
}

export type WatchOnrampProvidersReturnType = () => void;

/**
 * Watch for new onramp providers registration
 */
export const watchOnrampProviders = (
    appKit: AppKit,
    parameters: WatchOnrampProvidersParameters,
): WatchOnrampProvidersReturnType => {
    const { onChange } = parameters;

    const unsubscribeRegistered = appKit.emitter.on('provider:registered', (event) => {
        if (event.payload.type === 'onramp') onChange();
    });

    const unsubscribeDefaultChanged = appKit.emitter.on('provider:default-changed', (event) => {
        if (event.payload.type === 'onramp') onChange();
    });

    return () => {
        unsubscribeRegistered();
        unsubscribeDefaultChanged();
    };
};
