/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { toTransactionEmulatedTrace } from '../clients/toncenter/mappers/map-emulation-trace';
import { computeMoneyFlow } from './computeMoneyFlow';
import type { EmulationResponse } from '../api/models';
import { ERROR_CODES } from '../errors/codes';
import { CallForSuccess } from './retry';
import type { TransactionEmulatedPreview, TransactionRequest } from '../api/models';
import { Result } from '../api/models';
import type { Wallet } from '../api/interfaces';
import type { ApiClient } from '../api/interfaces';

export async function createTransactionPreview(
    client: ApiClient,
    request: TransactionRequest,
    wallet?: Wallet,
): Promise<TransactionEmulatedPreview> {
    const txData = await wallet?.getSignedSendTransaction(request, { fakeSignature: true });

    if (!txData) {
        return {
            result: Result.failure,
            error: {
                code: ERROR_CODES.UNKNOWN_EMULATION_ERROR,
                message: 'Unknown emulation error',
            },
        };
    }

    let emulationResult: EmulationResponse;
    try {
        const emulatedResult = await CallForSuccess(() => client.fetchEmulation(txData, true));
        if (emulatedResult.result === 'success') {
            emulationResult = emulatedResult.emulationResult;
        } else {
            return {
                result: Result.failure,
                error: {
                    code: emulatedResult.emulationError.code,
                    message: emulatedResult.emulationError.message,
                },
            };
        }
    } catch (_error) {
        return {
            result: Result.failure,
            error: {
                code: ERROR_CODES.UNKNOWN_EMULATION_ERROR,
                message: 'Unknown emulation error',
            },
        };
    }

    return {
        result: Result.success,
        trace: toTransactionEmulatedTrace(emulationResult),
        moneyFlow: computeMoneyFlow(emulationResult),
    };
}
