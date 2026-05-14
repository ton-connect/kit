/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiError, DefiErrorCode } from '@ton/appkit';

/**
 * Map a thrown error to an i18n key from the `defi.*` namespace.
 * Returns `null` when the error isn't a {@link DefiError} or the code isn't recognised —
 * callers should decide on their own fallback (usually a domain-specific key).
 */
export const mapDefiError = (error: unknown): string | null => {
    if (!(error instanceof DefiError)) return null;

    switch (error.code) {
        case DefiErrorCode.UnsupportedNetwork:
            return 'defi.unsupportedNetwork';
        case DefiErrorCode.NetworkError:
            return 'defi.networkError';
        case DefiErrorCode.ProviderNotFound:
            return 'defi.providerNotFound';
        case DefiErrorCode.NoDefaultProvider:
            return 'defi.noDefaultProvider';
        case DefiErrorCode.InvalidProvider:
            return 'defi.invalidProvider';
        case DefiErrorCode.InvalidParams:
            return 'defi.invalidParams';
        default:
            return null;
    }
};
