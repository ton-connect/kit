/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getErrorMessage } from '@/core/utils/errors/get-error-message';

/**
 * Converts ledger-specific error codes to user-friendly messages
 */
export const getLedgerErrorMessage = (err: unknown, defaultMessage?: string): string => {
    const message = getErrorMessage(err).toLowerCase();

    if (message.includes('0x6d02') || message.includes('unknown_apdu')) {
        return 'TON app is not open on your Ledger device. Please open it and try again.';
    }
    if (message.includes('0x6985') || message.includes('denied')) {
        return 'Action was rejected on Ledger device.';
    }
    if (message.includes('no ledger device') || message.includes('no device')) {
        return 'Ledger device not connected. Please connect your device and try again.';
    }
    if (message.includes('locked')) {
        return 'Ledger device is locked. Please unlock it and try again.';
    }
    if (message.includes('timeout')) {
        return 'Connection timeout. Please try again.';
    }
    if (message.includes('disconnected')) {
        return 'Ledger device was disconnected. Please reconnect and try again.';
    }

    return getErrorMessage(err, defaultMessage);
};
