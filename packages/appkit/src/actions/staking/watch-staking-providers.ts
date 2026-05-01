/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';

export interface WatchStakingProvidersParameters {
    onChange: () => void;
}

export type WatchStakingProvidersReturnType = () => void;

/**
 * Watch for staking providers registration and default provider changes
 */
export const watchStakingProviders = (
    appKit: AppKit,
    parameters: WatchStakingProvidersParameters,
): WatchStakingProvidersReturnType => {
    const { onChange } = parameters;

    const onEvent = (event: { payload: { type: string } }) => {
        if (event.payload.type === 'staking') {
            onChange();
        }
    };

    const unsubscribeRegistered = appKit.emitter.on('provider:registered', onEvent);
    const unsubscribeDefaultChanged = appKit.emitter.on('provider:default-changed', onEvent);

    return () => {
        unsubscribeRegistered();
        unsubscribeDefaultChanged();
    };
};
