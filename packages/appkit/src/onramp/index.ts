/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Internal-only re-exports (used by appkit code; not yet part of the public API).
export { OnrampManager } from '@ton/walletkit';
export type { OnrampProviderInterface, OnrampParams, OnrampQuote, OnrampQuoteParams } from '@ton/walletkit';

// fiat-onramp: not ready — exported via sub-path to keep off main @ton/appkit API
export {
    getOnrampProvider,
    type GetOnrampProviderOptions,
    type GetOnrampProviderReturnType,
} from '../actions/onramp/get-onramp-provider';
export { getOnrampProviders, type GetOnrampProvidersReturnType } from '../actions/onramp/get-onramp-providers';
export {
    getOnrampQuote,
    type GetOnrampQuoteOptions,
    type GetOnrampQuoteReturnType,
} from '../actions/onramp/get-onramp-quote';
export {
    watchOnrampProviders,
    type WatchOnrampProvidersParameters,
    type WatchOnrampProvidersReturnType,
} from '../actions/onramp/watch-onramp-providers';
export {
    buildOnrampUrl,
    type BuildOnrampUrlOptions,
    type BuildOnrampUrlReturnType,
} from '../actions/onramp/build-onramp-url';
