/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { OnrampError } from '@ton/appkit/onramp';

import { mapDefiError } from '../../../../../utils/map-defi-error';

/**
 * Map a thrown onramp error to an i18n key. Tries onramp-specific codes first,
 * falls back to the shared {@link mapDefiError}, and finally to a generic
 * `onramp.genericError`.
 */
export const mapOnrampError = (error: unknown): string => {
    if (error instanceof OnrampError) {
        switch (error.code) {
            case OnrampError.PAIR_NOT_SUPPORTED:
                return 'onramp.pairNotSupported';
            case OnrampError.QUOTE_FAILED:
                return 'onramp.noQuotesFound';
            case OnrampError.URL_BUILD_FAILED:
                return 'onramp.urlBuildFailed';
            case OnrampError.PROVIDER_ERROR:
                return 'onramp.providerError';
        }
    }

    return mapDefiError(error) ?? 'onramp.genericError';
};
