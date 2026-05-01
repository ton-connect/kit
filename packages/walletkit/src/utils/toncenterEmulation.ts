/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { toTransactionEmulatedTrace } from '../clients/toncenter/mappers/map-emulation-trace';
import { computeMoneyFlow } from './computeMoneyFlow';
import type { EmulationResponse } from '../api/models/emulation';
import { ERROR_CODES } from '../errors/codes';
import { CallForSuccess } from './retry';
import type { TransactionEmulatedPreview, TransactionRequest } from '../api/models';
import { Result } from '../api/models';
import { SendModeToValue } from './sendMode';
import type { Wallet } from '../api/interfaces';
import type { ApiClient } from '../api/interfaces/ApiClient';

export interface ToncenterMessage {
    method: string;
    headers: {
        'Content-Type': string;
    };
    body: string;
}

export type { EmulationResult as ToncenterEmulationResult } from '../api/models/emulation';

/**
 * Creates a toncenter message payload for emulation
 */
export function createToncenterMessage(
    walletAddress: string | undefined,
    messages: TransactionRequest['messages'],
): ToncenterMessage {
    return {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: walletAddress,
            valid_until: Math.floor(Date.now() / 1000) + 60,
            include_code_data: true,
            include_address_book: true,
            include_metadata: true,
            with_actions: true,
            messages: messages.map((m) => ({
                address: m.address,
                amount: m.amount,
                payload: m.payload,
                stateInit: m.stateInit,
                extraCurrency: m.extraCurrency,
                mode: m.mode ? SendModeToValue(m.mode) : undefined,
            })),
        }),
    };
}

export class FetchToncenterEmulationError extends Error {
    response: Response;
    constructor(message: string, response: Response) {
        super(message);
        this.name = 'fetchToncenterEmulationError';
        this.response = response;
    }
}

/**
 * Creates a transaction preview by emulating the transaction
 */
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
