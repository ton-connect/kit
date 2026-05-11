/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiError } from '@ton/appkit';

/**
 * Map a thrown error to an i18n key from the `defi.*` namespace.
 * Returns `null` when the error isn't a {@link appkit:DefiError} or the code isn't recognised —
 * callers should decide on their own fallback (usually a domain-specific key).
 */
export const mapDefiError = (error: unknown): string | null => {
    if (!(error instanceof DefiError)) return null;

    switch (error.code) {
        case DefiError.UNSUPPORTED_NETWORK:
            return 'defi.unsupportedNetwork';
        case DefiError.NETWORK_ERROR:
            return 'defi.networkError';
        case DefiError.PROVIDER_NOT_FOUND:
            return 'defi.providerNotFound';
        case DefiError.NO_DEFAULT_PROVIDER:
            return 'defi.noDefaultProvider';
        case DefiError.INVALID_PROVIDER:
            return 'defi.invalidProvider';
        case DefiError.INVALID_PARAMS:
            return 'defi.invalidParams';
        default:
            return null;
    }
};
