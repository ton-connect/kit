/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { StakingError, StakingErrorCode } from '@ton/appkit';

import { mapDefiError } from '../../../utils/map-defi-error';

/**
 * Map a thrown staking error to an i18n key. Tries staking-specific codes first, falls back to the
 * shared {@link mapDefiError} for base DeFi codes, and finally to a generic `staking.quoteError`.
 */
export const mapStakingError = (error: unknown): string => {
    if (error instanceof StakingError) {
        switch (error.code) {
            case StakingErrorCode.InvalidParams:
                return 'staking.invalidParams';
            case StakingErrorCode.UnsupportedOperation:
                return 'staking.unsupportedOperation';
        }
    }

    return mapDefiError(error) ?? 'staking.quoteError';
};
