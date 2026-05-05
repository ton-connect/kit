/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// fiat-onramp: not ready — exported via sub-path to keep off main @ton/appkit API

export { OnrampProvider, OnrampManager, OnrampError } from '@ton/walletkit';

export type {
    OnrampAPI,
    OnrampProviderInterface,
    OnrampProviderMetadata,
    OnrampProviderMetadataOverride,
    OnrampQuote,
    OnrampQuoteParams,
    OnrampParams,
    OnrampServiceInfo,
    OnrampFee,
    OnrampFeeType,
} from '@ton/walletkit';

export {
    getOnrampProvider,
    type GetOnrampProviderOptions,
    type GetOnrampProviderReturnType,
} from '../actions/onramp/get-onramp-provider';
export { getOnrampProviders, type GetOnrampProvidersReturnType } from '../actions/onramp/get-onramp-providers';
export {
    getOnrampQuotes,
    type GetOnrampQuotesOptions,
    type GetOnrampQuotesReturnType,
} from '../actions/onramp/get-onramp-quotes';
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
