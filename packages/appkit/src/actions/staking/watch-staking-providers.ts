/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';

/**
 * Parameters accepted by {@link watchStakingProviders}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export interface WatchStakingProvidersParameters {
    /** Callback fired whenever a staking provider is registered or the default staking provider changes. */
    onChange: () => void;
}

/**
 * Return type of {@link watchStakingProviders} — call to stop receiving updates.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type WatchStakingProvidersReturnType = () => void;

/**
 * Subscribe to staking provider lifecycle — fires `onChange` whenever a new provider is registered or the default staking provider switches.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link WatchStakingProvidersParameters} Update callback.
 * @returns Unsubscribe function — call it to stop receiving updates.
 *
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Staking
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
