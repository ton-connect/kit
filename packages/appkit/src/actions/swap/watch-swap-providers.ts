/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';

/**
 * Parameters accepted by {@link watchSwapProviders}.
 *
 * @public
 * @category Type
 * @section Swap
 */
export interface WatchSwapProvidersParameters {
    /** Callback fired whenever a swap provider is registered or the default swap provider changes. */
    onChange: () => void;
}

/**
 * Return type of {@link watchSwapProviders} — call to stop receiving updates.
 *
 * @public
 * @category Type
 * @section Swap
 */
export type WatchSwapProvidersReturnType = () => void;

/**
 * Subscribe to swap provider lifecycle — fires `onChange` whenever a new provider is registered or the default swap provider switches.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link WatchSwapProvidersParameters} Update callback.
 * @returns Unsubscribe function — call it to stop receiving updates.
 *
 * @sample docs/examples/src/appkit/actions/swap#WATCH_SWAP_PROVIDERS
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Swap
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
