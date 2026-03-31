/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { PROVIDER_EVENTS } from '../../core/app-kit';

export interface WatchSwapProvidersParameters {
    onChange: () => void;
}

export type WatchSwapProvidersReturnType = () => void;

/**
 * Watch for new swap providers registration
 */
export const watchSwapProviders = (
    appKit: AppKit,
    parameters: WatchSwapProvidersParameters,
): WatchSwapProvidersReturnType => {
    const { onChange } = parameters;

    const unsubscribe = appKit.emitter.on(PROVIDER_EVENTS.REGISTERED, (event) => {
        if (event.payload.providerType === 'swap') {
            onChange();
        }
    });

    return unsubscribe;
};
