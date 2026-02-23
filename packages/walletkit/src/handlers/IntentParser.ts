/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ConnectRequest } from '@tonconnect/protocol';

import { WalletKitError, ERROR_CODES } from '../errors';
import type {
    IntentActionItem,
    IntentRequestEvent,
    TransactionIntentRequestEvent,
    SignDataIntentRequestEvent,
    ActionIntentRequestEvent,
    IntentDeliveryMode,
    TransactionRequest,
    SignDataPayload,
    SignData,
    Base64String,
} from '../api/models';

const INTENT_INLINE_SCHEME = 'tc://intent_inline';
const INTENT_SCHEME = 'tc://intent';

/**
 * Wire-format intent method identifiers from the TonConnect spec.
 */
type WireIntentMethod = 'txIntent' | 'signMsg' | 'signIntent' | 'actionIntent';

const VALID_METHODS: WireIntentMethod[] = ['txIntent', 'signMsg', 'signIntent', 'actionIntent'];

/**
 * Wire-format intent item types.
 */
type WireItemType = 'ton' | 'jetton' | 'nft';

/**
 * Wire-format intent item (short field names from spec).
 */
interface WireIntentItem {
    t: WireItemType;
    // ton
    a?: string;
    am?: string;
    p?: string;
    si?: string;
    ec?: Record<string, string>;
    // jetton
    ma?: string;
    ja?: string;
    d?: string;
    rd?: string;
    cp?: string;
    fta?: string;
    fp?: string;
    qi?: number;
    // nft
    na?: string;
    no?: string;
}

/**
 * Wire-format intent request payload.
 */
interface WireIntentRequest {
    id: string;
    m: WireIntentMethod;
    c?: ConnectRequest;
    // txIntent / signMsg
    i?: WireIntentItem[];
    vu?: number;
    n?: string;
    // signIntent
    mu?: string;
    p?: { type: string; text?: string; bytes?: string; schema?: string; cell?: string };
    // actionIntent
    a?: string;
}

/**
 * Parsed intent URL — intermediate result before event creation.
 */
export interface ParsedIntentUrl {
    clientId: string;
    request: WireIntentRequest;
}

/**
 * Intent error codes from the TonConnect spec.
 */
export const INTENT_ERROR_CODES = {
    UNKNOWN: 0,
    BAD_REQUEST: 1,
    UNKNOWN_APP: 100,
    ACTION_URL_UNREACHABLE: 200,
    USER_DECLINED: 300,
    METHOD_NOT_SUPPORTED: 400,
} as const;

export type IntentErrorCode = (typeof INTENT_ERROR_CODES)[keyof typeof INTENT_ERROR_CODES];

/**
 * Pure parsing layer for intent deep links.
 *
 * Responsibility: URL parsing, payload decoding, wire→model mapping, validation.
 * No side effects, no I/O, no crypto.
 */
export class IntentParser {
    /**
     * Check if a URL is a TonConnect intent deep link.
     */
    isIntentUrl(url: string): boolean {
        const normalized = url.trim().toLowerCase();
        return normalized.startsWith(INTENT_INLINE_SCHEME) || normalized.startsWith(INTENT_SCHEME);
    }

    /**
     * Parse an intent URL into a typed IntentRequestEvent.
     */
    parse(url: string): { event: IntentRequestEvent; connectRequest?: ConnectRequest } {
        const parsed = this.parseUrl(url);
        return this.toIntentEvent(parsed);
    }

    // -- URL parsing ----------------------------------------------------------

    private parseUrl(url: string): ParsedIntentUrl {
        try {
            const parsedUrl = new URL(url);
            const clientId = parsedUrl.searchParams.get('id');
            if (!clientId) {
                throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Missing client ID (id) in intent URL');
            }

            if (!url.toLowerCase().startsWith(INTENT_INLINE_SCHEME)) {
                throw new WalletKitError(
                    ERROR_CODES.VALIDATION_ERROR,
                    'Only inline intents (tc://intent_inline) are supported',
                );
            }

            return this.parseInlinePayload(parsedUrl, clientId);
        } catch (error) {
            if (error instanceof WalletKitError) throw error;
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Invalid intent URL format', error as Error);
        }
    }

    private parseInlinePayload(parsedUrl: URL, clientId: string): ParsedIntentUrl {
        const encoded = parsedUrl.searchParams.get('r');
        if (!encoded) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Missing payload (r) in intent URL');
        }

        const json = this.decodePayload(encoded);
        let request: WireIntentRequest;
        try {
            request = JSON.parse(json) as WireIntentRequest;
        } catch (error) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Invalid JSON in intent payload', error as Error);
        }

        this.validateRequest(request);
        return { clientId, request };
    }

    // -- Payload decoding -----------------------------------------------------

    private decodePayload(encoded: string): string {
        if (encoded.startsWith('%7B') || encoded.startsWith('%257B') || encoded.startsWith('{')) {
            let decoded = decodeURIComponent(encoded);
            if (decoded.startsWith('%7B') || decoded.startsWith('%')) {
                decoded = decodeURIComponent(decoded);
            }
            return decoded;
        }
        return this.decodeBase64Url(encoded);
    }

    private decodeBase64Url(encoded: string): string {
        let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        const padding = base64.length % 4;
        if (padding) base64 += '='.repeat(4 - padding);

        if (typeof atob === 'function') {
            return atob(base64);
        }
        return Buffer.from(base64, 'base64').toString('utf-8');
    }

    // -- Validation -----------------------------------------------------------

    private validateRequest(request: WireIntentRequest): void {
        if (!request.id) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Intent request missing id');
        }
        if (!request.m || !VALID_METHODS.includes(request.m)) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, `Invalid intent method: ${request.m}`);
        }

        switch (request.m) {
            case 'txIntent':
            case 'signMsg':
                this.validateTransactionItems(request);
                break;
            case 'signIntent':
                this.validateSignData(request);
                break;
            case 'actionIntent':
                this.validateAction(request);
                break;
        }
    }

    private validateTransactionItems(request: WireIntentRequest): void {
        if (!request.i || !Array.isArray(request.i) || request.i.length === 0) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Transaction intent missing items (i)');
        }
        for (const item of request.i) {
            this.validateItem(item);
        }
    }

    private validateItem(item: WireIntentItem): void {
        const validTypes: WireItemType[] = ['ton', 'jetton', 'nft'];
        if (!item.t || !validTypes.includes(item.t)) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, `Invalid intent item type: ${item.t}`);
        }

        switch (item.t) {
            case 'ton':
                if (!item.a) throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'TON item missing address (a)');
                if (!item.am) throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'TON item missing amount (am)');
                break;
            case 'jetton':
                if (!item.ma)
                    throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Jetton item missing master address (ma)');
                if (!item.ja) throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Jetton item missing amount (ja)');
                if (!item.d)
                    throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Jetton item missing destination (d)');
                break;
            case 'nft':
                if (!item.na) throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'NFT item missing address (na)');
                if (!item.no) throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'NFT item missing new owner (no)');
                break;
        }
    }

    private validateSignData(request: WireIntentRequest): void {
        const manifestUrl = request.mu || request.c?.manifestUrl;
        if (!manifestUrl) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Sign data intent missing manifest URL');
        }
        if (!request.p || !request.p.type) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Sign data intent missing payload');
        }
    }

    private validateAction(request: WireIntentRequest): void {
        if (!request.a) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Action intent missing action URL (a)');
        }
    }

    /**
     * Parse an action URL response payload into a typed intent event.
     *
     * Action URLs return standard TonConnect payloads:
     * - `{ action_type: 'sendTransaction', action: { messages, valid_until?, network? } }`
     * - `{ action_type: 'signData', action: { type, text?|bytes?|cell?, schema? } }`
     */
    parseActionResponse(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: any,
        sourceEvent: ActionIntentRequestEvent,
    ): IntentRequestEvent {
        const { action_type, action } = payload as { action_type?: string; action?: Record<string, unknown> };

        if (!action_type || !action) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Action URL response missing action_type or action');
        }

        const base = {
            id: sourceEvent.id,
            origin: sourceEvent.origin,
            clientId: sourceEvent.clientId,
            hasConnectRequest: sourceEvent.hasConnectRequest,
        };

        switch (action_type) {
            case 'sendTransaction':
                return this.parseActionTransaction(base, action);
            case 'signData':
                return this.parseActionSignData(base, action, sourceEvent.actionUrl);
            default:
                throw new WalletKitError(
                    ERROR_CODES.VALIDATION_ERROR,
                    `Action URL returned unsupported action_type: ${action_type}`,
                );
        }
    }

    private parseActionTransaction(
        base: { id: string; origin: string; clientId?: string; hasConnectRequest: boolean },
        action: Record<string, unknown>,
    ): TransactionIntentRequestEvent {
        const rawMessages = action.messages as Array<Record<string, unknown>> | undefined;
        if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Action sendTransaction missing messages');
        }

        const messages = rawMessages.map((msg) => ({
            address: msg.address as string,
            amount: msg.amount as string,
            payload: msg.payload as Base64String | undefined,
            stateInit: (msg.stateInit ?? msg.state_init) as Base64String | undefined,
            extraCurrency: (msg.extraCurrency ?? msg.extra_currency) as Record<string, string> | undefined,
        }));

        const resolvedTransaction: TransactionRequest = {
            messages,
            network: action.network as TransactionRequest['network'],
            validUntil: (action.valid_until ?? action.validUntil) as number | undefined,
        };

        return {
            ...base,
            intentType: 'transaction',
            deliveryMode: 'send',
            network: action.network as string | undefined,
            validUntil: resolvedTransaction.validUntil,
            items: [],
            resolvedTransaction,
        } as TransactionIntentRequestEvent;
    }

    private parseActionSignData(
        base: { id: string; origin: string; clientId?: string; hasConnectRequest: boolean },
        action: Record<string, unknown>,
        actionUrl: string,
    ): SignDataIntentRequestEvent {
        const wirePayload = {
            type: action.type as string,
            text: action.text as string | undefined,
            bytes: action.bytes as string | undefined,
            cell: action.cell as string | undefined,
            schema: action.schema as string | undefined,
        };

        if (!wirePayload.type) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Action signData missing type');
        }

        return {
            ...base,
            intentType: 'signData',
            network: action.network as string | undefined,
            manifestUrl: actionUrl,
            payload: this.wirePayloadToSignDataPayload(wirePayload),
        } as SignDataIntentRequestEvent;
    }

    // -- Wire → Model mapping -------------------------------------------------

    private toIntentEvent(parsed: ParsedIntentUrl): { event: IntentRequestEvent; connectRequest?: ConnectRequest } {
        const { clientId, request } = parsed;
        const hasConnectRequest = !!request.c;

        const base = {
            id: request.id,
            origin: 'deepLink' as const,
            clientId,
            hasConnectRequest,
            returnStrategy: undefined,
        };

        let event: IntentRequestEvent;

        switch (request.m) {
            case 'txIntent':
            case 'signMsg': {
                const deliveryMode: IntentDeliveryMode = request.m === 'txIntent' ? 'send' : 'signOnly';
                event = {
                    ...base,
                    intentType: 'transaction',
                    deliveryMode,
                    network: request.n,
                    validUntil: request.vu,
                    items: this.mapItems(request.i!),
                } as TransactionIntentRequestEvent;
                break;
            }
            case 'signIntent': {
                const manifestUrl = request.mu || request.c?.manifestUrl || '';
                event = {
                    ...base,
                    intentType: 'signData',
                    network: request.n,
                    manifestUrl,
                    payload: this.wirePayloadToSignDataPayload(request.p!),
                } as SignDataIntentRequestEvent;
                break;
            }
            case 'actionIntent': {
                event = {
                    ...base,
                    intentType: 'action',
                    actionUrl: request.a!,
                } as ActionIntentRequestEvent;
                break;
            }
        }

        return { event, connectRequest: request.c };
    }

    private mapItems(wireItems: WireIntentItem[]): IntentActionItem[] {
        return wireItems.map((item) => this.mapItem(item));
    }

    private mapItem(item: WireIntentItem): IntentActionItem {
        switch (item.t) {
            case 'ton':
                return {
                    type: 'sendTon',
                    address: item.a!,
                    amount: item.am!,
                    payload: item.p as Base64String | undefined,
                    stateInit: item.si as Base64String | undefined,
                    extraCurrency: item.ec,
                };
            case 'jetton':
                return {
                    type: 'sendJetton',
                    jettonMasterAddress: item.ma!,
                    jettonAmount: item.ja!,
                    destination: item.d!,
                    responseDestination: item.rd,
                    customPayload: item.cp as Base64String | undefined,
                    forwardTonAmount: item.fta,
                    forwardPayload: item.fp as Base64String | undefined,
                    queryId: item.qi,
                };
            case 'nft':
                return {
                    type: 'sendNft',
                    nftAddress: item.na!,
                    newOwnerAddress: item.no!,
                    responseDestination: item.rd,
                    customPayload: item.cp as Base64String | undefined,
                    forwardTonAmount: item.fta,
                    forwardPayload: item.fp as Base64String | undefined,
                    queryId: item.qi,
                };
        }
    }

    /**
     * Convert a wire-format sign data payload to SignDataPayload model.
     */
    private wirePayloadToSignDataPayload(wire: {
        type: string;
        text?: string;
        bytes?: string;
        schema?: string;
        cell?: string;
    }): SignDataPayload {
        let data: SignData;

        switch (wire.type) {
            case 'text':
                data = { type: 'text', value: { content: wire.text || '' } };
                break;
            case 'binary':
                data = { type: 'binary', value: { content: (wire.bytes || '') as Base64String } };
                break;
            case 'cell':
                data = {
                    type: 'cell',
                    value: { schema: wire.schema || '', content: (wire.cell || '') as Base64String },
                };
                break;
            default:
                throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, `Unsupported sign data type: ${wire.type}`);
        }

        return { data };
    }
}
