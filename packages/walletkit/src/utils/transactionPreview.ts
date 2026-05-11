/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CommonMessageInfoInternal } from '@ton/core';
import { beginCell, Cell, loadMessageRelaxed, storeMessageRelaxed } from '@ton/core';

import { toTransactionEmulatedTrace } from '../clients/toncenter/mappers/map-emulation-trace';
import { computeMoneyFlow } from './computeMoneyFlow';
import type { Base64String, EmulationResponse } from '../api/models';
import { ERROR_CODES } from '../errors/codes';
import { CallForSuccess } from './retry';
import type { TransactionEmulatedPreview, TransactionRequest } from '../api/models';
import { Result } from '../api/models';
import type { Wallet } from '../api/interfaces';
import type { ApiClient } from '../api/interfaces';
import type { TonWalletKitOptions } from '../types';
import { globalLogger } from '../core/Logger';

const log = globalLogger.createChild('TransactionPreview');

export type TransactionPreviewMode = 'send' | 'sign';

const SIGN_MODE_EMULATION_VALUE = 2_000_000_000n;

export interface TransactionPreviewOptions {
    // 'send' emulates the external message as-is; 'sign' emulates the internal body
    mode?: TransactionPreviewMode;
    relayGas?: bigint; // gas amount to inject for gasless relaying, by default 2 TON
}

export async function createTransactionPreview(
    client: ApiClient,
    request: TransactionRequest,
    wallet?: Wallet,
    options: TransactionPreviewOptions = {},
): Promise<TransactionEmulatedPreview> {
    const mode: TransactionPreviewMode = options.mode ?? 'send';
    const isSignMode = mode === 'sign';

    // const txData = await wallet?.getSignedSendTransaction(request, { fakeSignature: true, internal: isSignMode });
    const signedBoc = await wallet?.getSignedSendTransaction(request, {
        fakeSignature: true,
        internal: isSignMode,
    });

    if (!signedBoc) {
        return {
            result: Result.failure,
            error: {
                code: ERROR_CODES.UNKNOWN_EMULATION_ERROR,
                message: 'Unknown emulation error',
            },
        };
    }

    const bocForEmulation = isSignMode ? wrapInternalForSignEmulation(signedBoc, options) : signedBoc;

    let emulationResult: EmulationResponse;
    try {
        const emulatedResult = await CallForSuccess(() => client.fetchEmulation(bocForEmulation, true));
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
        moneyFlow: computeMoneyFlow(emulationResult, { skipFirstTxInput: isSignMode }),
    };
}

function wrapInternalForSignEmulation(relaxedBoc: Base64String, options: TransactionPreviewOptions): Base64String {
    const cell = Cell.fromBase64(relaxedBoc);
    const message = loadMessageRelaxed(cell.beginParse());
    if (message.info.type !== 'internal') {
        throw new Error('Expected relaxed internal message for sign-mode emulation');
    }
    const info = message.info as CommonMessageInfoInternal;
    info.value = { coins: options.relayGas ?? SIGN_MODE_EMULATION_VALUE };
    return beginCell().store(storeMessageRelaxed(message)).endCell().toBoc().toString('base64') as Base64String;
}

export async function createTransactionPreviewIfPossible(
    config: TonWalletKitOptions,
    client: ApiClient,
    request: TransactionRequest,
    wallet?: Wallet,
    options: TransactionPreviewOptions = {},
): Promise<TransactionEmulatedPreview | undefined> {
    if (config.eventProcessor?.disableTransactionEmulation) {
        return undefined;
    }

    let preview: TransactionEmulatedPreview | undefined;
    try {
        preview = await CallForSuccess(() => createTransactionPreview(client, request, wallet, options));
    } catch (error) {
        log.error('Failed to create transaction preview', { error });
        preview = {
            error: {
                code: ERROR_CODES.UNKNOWN_EMULATION_ERROR,
                message: 'Unknown emulation error',
            },
            result: Result.failure,
        };
    }

    return preview;
}
