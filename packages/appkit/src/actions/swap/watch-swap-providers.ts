/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';

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

    const unsubscribeRegistered = appKit.emitter.on('provider:registered', (event) => {
        if (event.payload.type === 'swap') onChange();
    });

    const unsubscribeDefaultChanged = appKit.emitter.on('provider:default-changed', (event) => {
        if (event.payload.type === 'swap') onChange();
    });

    return () => {
        unsubscribeRegistered();
        unsubscribeDefaultChanged();
    };
};
