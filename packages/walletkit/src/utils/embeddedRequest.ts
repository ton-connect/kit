/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ParsedEmbeddedRequest } from '@tonconnect/protocol';
import { parseEmbeddedRequest } from '@tonconnect/protocol';

import type { EmbeddedRequest } from '../api/models';
import type { RawConnectTransactionParamContent, RawBridgeEventSignData } from '../types/internal';
import {
    parseConnectTransactionParamContent,
    toTransactionRequest,
    parseConnectSignDataParamContent,
} from '../types/internal';
import { globalLogger } from '../core/Logger';

const log = globalLogger.createChild('embeddedRequestParser');

/**
 * Parse the `req` URL parameter into an EmbeddedRequest using the protocol's parseEmbeddedRequest.
 * Returns undefined if the parameter is malformed or contains an unrecognized method.
 */
export function parseEmbeddedRequestFromReqParam(reqParam: string): EmbeddedRequest | undefined {
    try {
        const parsed = parseEmbeddedRequest(reqParam);
        return toEmbeddedRequest(parsed);
    } catch (error) {
        log.warn('Failed to parse embedded request req parameter', { error });
        return undefined;
    }
}

function toEmbeddedRequest(parsed: ParsedEmbeddedRequest): EmbeddedRequest | undefined {
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
            log.warn('Unknown embedded request method', { method: (parsed as { method: string }).method });
            return undefined;
    }
}
