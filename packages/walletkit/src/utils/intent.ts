/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ParsedEmbeddedRequest } from '@tonconnect/protocol';
import { parseEmbeddedRequest } from '@tonconnect/protocol';

import type { IntentAction } from '../api/models';
import type { RawConnectTransactionParamContent, RawBridgeEventSignData } from '../types/internal';
import {
    parseConnectTransactionParamContent,
    toTransactionRequest,
    parseConnectSignDataParamContent,
} from '../types/internal';
import { globalLogger } from '../core/Logger';

const log = globalLogger.createChild('intentParser');

/**
 * Parse the `req` URL parameter into an IntentAction using the protocol's parseEmbeddedRequest.
 * Returns undefined if the parameter is malformed or contains an unrecognized method.
 */
export function parseIntentFromReqParam(reqParam: string): IntentAction | undefined {
    try {
        const parsed = parseEmbeddedRequest(reqParam);
        return toIntentAction(parsed);
    } catch (error) {
        log.warn('Failed to parse intent req parameter', { error });
        return undefined;
    }
}

function toIntentAction(parsed: ParsedEmbeddedRequest): IntentAction | undefined {
    switch (parsed.method) {
        case 'sendTransaction':
        case 'signMessage': {
            const raw = JSON.parse(parsed.params[0]) as RawConnectTransactionParamContent;
            const content = parseConnectTransactionParamContent(raw);
            const transactionRequest = toTransactionRequest(content);
            return { method: parsed.method, transactionRequest };
        }
        case 'signData': {
            const signDataEvent = { ...parsed, id: '' } as RawBridgeEventSignData;
            const payload = parseConnectSignDataParamContent(signDataEvent);
            if (!payload) return undefined;
            return { method: 'signData', payload };
        }
        default:
            log.warn('Unknown intent method', { method: (parsed as { method: string }).method });
            return undefined;
    }
}
