/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { PROVIDER_EVENTS } from '../../core/app-kit';

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

    const unsubscribe = appKit.emitter.on(PROVIDER_EVENTS.REGISTERED, (event) => {
        if (event.payload.providerType === 'onramp') {
            onChange();
        }
    });

    return unsubscribe;
};
