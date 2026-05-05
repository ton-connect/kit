/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CryptoOnrampError } from '@ton/appkit';

import { mapDefiError } from '../../../../../utils/map-defi-error';

/**
 * Map a thrown crypto-onramp error to an i18n key. Tries crypto-onramp-specific codes first,
 * falls back to the shared {@link mapDefiError} for base DeFi codes, and finally to a generic
 * `cryptoOnramp.genericError`.
 */
export const mapCryptoOnrampError = (error: unknown): string => {
    if (error instanceof CryptoOnrampError) {
        switch (error.code) {
            case CryptoOnrampError.REFUND_ADDRESS_REQUIRED:
                return 'cryptoOnramp.refundAddressRequired';
            case CryptoOnrampError.REVERSED_AMOUNT_NOT_SUPPORTED:
                return 'cryptoOnramp.reversedAmountNotSupported';
            case CryptoOnrampError.INVALID_REFUND_ADDRESS:
                return 'cryptoOnramp.invalidRefundAddress';
            case CryptoOnrampError.QUOTE_FAILED:
                return 'cryptoOnramp.quoteError';
            case CryptoOnrampError.PROVIDER_ERROR:
                return 'cryptoOnramp.providerError';
            case CryptoOnrampError.DEPOSIT_FAILED:
                return 'cryptoOnramp.depositFailed';
        }
    }

    return mapDefiError(error) ?? 'cryptoOnramp.genericError';
};
