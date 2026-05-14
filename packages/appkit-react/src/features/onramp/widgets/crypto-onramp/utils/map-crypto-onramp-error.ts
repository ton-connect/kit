/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CryptoOnrampError, CryptoOnrampErrorCode } from '@ton/appkit';

import { mapDefiError } from '../../../../../utils/map-defi-error';

/**
 * Map a thrown crypto-onramp error to an i18n key. Tries crypto-onramp-specific codes first,
 * falls back to the shared {@link mapDefiError} for base DeFi codes, and finally to a generic
 * `cryptoOnramp.genericError`.
 */
export const mapCryptoOnrampError = (error: unknown): string => {
    if (error instanceof CryptoOnrampError) {
        switch (error.code) {
            case CryptoOnrampErrorCode.RefundAddressRequired:
                return 'cryptoOnramp.refundAddressRequired';
            case CryptoOnrampErrorCode.ReversedAmountNotSupported:
                return 'cryptoOnramp.reversedAmountNotSupported';
            case CryptoOnrampErrorCode.InvalidRefundAddress:
                return 'cryptoOnramp.invalidRefundAddress';
            case CryptoOnrampErrorCode.QuoteFailed:
                return 'cryptoOnramp.quoteError';
            case CryptoOnrampErrorCode.ProviderError:
                return 'cryptoOnramp.providerError';
            case CryptoOnrampErrorCode.DepositFailed:
                return 'cryptoOnramp.depositFailed';
        }
    }

    return mapDefiError(error) ?? 'cryptoOnramp.genericError';
};
