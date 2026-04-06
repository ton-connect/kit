/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ConnectRequest } from '@tonconnect/protocol';
import nacl from 'tweetnacl';

import { globalLogger } from '../core/Logger';
import { WalletKitError, ERROR_CODES } from '../errors';
import type { RawBridgeEvent } from '../types/internal';
import type {
    IntentActionItem,
    IntentOrigin,
    IntentRequestEvent,
    IntentRequestBase,
    ActionIntentRequestEvent,
    IntentDeliveryMode,
    TransactionRequest,
    SignDataPayload,
    SignData,
    Base64String,
    Network,
} from '../api/models';

const VALID_METHODS = ['txDraft', 'signMsgDraft', 'signData', 'actionDraft'] as const;
const log = globalLogger.createChild('IntentParser');

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

interface TxDraftParams {
    vu?: number;
    f?: string;
    n?: string;
    i: WireIntentItem[];
}

type SignDataParams = [string];

interface ActionDraftParams {
    url: string;
}

/**
 * Spec-compliant intent request payload (PR #103).
 * method names match the spec: txDraft | signMsgDraft | signData | actionDraft.
 * params is nested (not flat) and ConnectRequest lives in the URL r param, not here.
 */
interface SpecIntentRequest {
    id: string;
    method: 'txDraft' | 'signMsgDraft' | 'signData' | 'actionDraft';
    params: TxDraftParams | SignDataParams | ActionDraftParams;
}

/**
 * Parsed intent URL — intermediate result before event creation.
 */
export interface ParsedIntentUrl {
    clientId?: string;
    /** Raw sender ID for connectedBridge events (used for session crypto lookup) */
    from?: string;
    request: SpecIntentRequest;
    connectRequest?: ConnectRequest;
    origin: IntentOrigin;
    traceId?: string;
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
 * Parsing layer for intent deep links.
 *
 * Responsibility: URL parsing, payload decoding (inline + object storage),
 * NaCl decryption, wire→model mapping, validation.
 */

export function isIntentUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url.trim());
        const method = parsedUrl.searchParams.get('m') || parsedUrl.searchParams.get('M');
        return method?.toLowerCase() === 'intent' || method?.toLowerCase() === 'intent_remote';
    } catch {
        return false;
    }
}

export class IntentParser {
    /**
     * Parse an intent URL into a typed IntentRequestEvent.
     * Supports both `m=intent` (URL-embedded) and `m=intent_remote` (object storage).
     */
    async parse(url: string): Promise<{ event: IntentRequestEvent; connectRequest?: ConnectRequest }> {
        const parsed = await this.parseUrl(url);
        return this.toIntentEvent(parsed);
    }

    /**
     * Parse a bridge-delivered draft RPC event into a typed IntentRequestEvent.
     * Used when the wallet is already connected and receives txDraft/signMsgDraft/actionDraft
     * via the existing bridge session (sendRequest path).
     */
    parseBridgeDraftPayload(rawEvent: RawBridgeEvent): IntentRequestEvent {
        const request: SpecIntentRequest = {
            id: rawEvent.id,
            method: rawEvent.method as 'txDraft' | 'signMsgDraft' | 'actionDraft',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            params: ((rawEvent.params as any)?.[0] ?? rawEvent.params ?? {}) as
                | TxDraftParams
                | SignDataParams
                | ActionDraftParams,
        };
        this.validateRequest(request);
        const parsed: ParsedIntentUrl = {
            clientId: rawEvent.from,
            from: rawEvent.from,
            request,
            connectRequest: undefined,
            origin: 'connectedBridge',
            traceId: rawEvent.traceId,
        };
        const { event } = this.toIntentEvent(parsed);
        return event;
    }

    // -- URL parsing ----------------------------------------------------------

    private async parseUrl(url: string): Promise<ParsedIntentUrl> {
        try {
            const parsedUrl = new URL(url);
            const clientId = parsedUrl.searchParams.get('id') || undefined;

            const methodKey = Array.from(parsedUrl.searchParams.keys()).find((k) => k.toLowerCase() === 'm');
            const method = methodKey ? parsedUrl.searchParams.get(methodKey)?.toLowerCase() : null;

            if (method === 'intent') {
                return this.parseInlinePayload(parsedUrl, clientId);
            }

            if (method === 'intent_remote') {
                if (!clientId) {
                    throw new WalletKitError(
                        ERROR_CODES.VALIDATION_ERROR,
                        'Missing client ID (id) in object storage intent URL (required for decryption)',
                    );
                }
                return this.parseObjectStoragePayload(parsedUrl, clientId);
            }

            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Unknown intent URL method');
        } catch (error) {
            if (error instanceof WalletKitError) throw error;
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Invalid intent URL format', error as Error);
        }
    }

    private parseInlinePayload(parsedUrl: URL, clientId: string | undefined): ParsedIntentUrl {
        const encoded = parsedUrl.searchParams.get('mp');
        if (!encoded) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Missing payload (mp) in intent URL');
        }
        const traceId = parsedUrl.searchParams.get('trace_id') || undefined;

        const rParam = parsedUrl.searchParams.get('r');
        const connectRequest = this.parseOptionalConnectRequest(rParam, 'inline');

        const json = this.decodePayload(encoded);
        let request: SpecIntentRequest;
        try {
            request = JSON.parse(json) as SpecIntentRequest;
        } catch (error) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Invalid JSON in intent payload', error as Error);
        }

        this.validateRequest(request);
        return { clientId, request, connectRequest, origin: 'deepLink', traceId };
    }

    /**
     * Parse an object storage intent URL.
     * Fetches encrypted payload from `get_url`, decrypts with NaCl using
     * the provided wallet private key and client public key.
     */
    private async parseObjectStoragePayload(parsedUrl: URL, clientId: string): Promise<ParsedIntentUrl> {
        const walletPrivateKey = parsedUrl.searchParams.get('pk');
        const getUrl = parsedUrl.searchParams.get('get_url');
        const traceId = parsedUrl.searchParams.get('trace_id') || undefined;

        if (!walletPrivateKey) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Missing wallet private key (pk) in intent URL');
        }
        if (!getUrl) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Missing get_url in intent URL');
        }

        const rParam = parsedUrl.searchParams.get('r');
        const connectRequest = this.parseOptionalConnectRequest(rParam, 'objectStorage');

        const encryptedPayload = await this.fetchObjectStoragePayload(getUrl);
        const json = this.decryptPayload(encryptedPayload, walletPrivateKey);

        let request: SpecIntentRequest;
        try {
            request = JSON.parse(json) as SpecIntentRequest;
        } catch (error) {
            throw new WalletKitError(
                ERROR_CODES.VALIDATION_ERROR,
                `Invalid JSON in decrypted intent payload: ${json.substring(0, 100)}`,
                error as Error,
            );
        }

        this.validateRequest(request);
        return { clientId, request, connectRequest, origin: 'objectStorage', traceId };
    }

    private parseOptionalConnectRequest(
        rawValue: string | null,
        source: 'inline' | 'objectStorage',
    ): ConnectRequest | undefined {
        if (!rawValue) {
            return undefined;
        }

        try {
            return JSON.parse(rawValue) as ConnectRequest;
        } catch (error) {
            log.warn('Failed to parse optional connect request from intent URL', {
                source,
                error,
            });
            return undefined;
        }
    }

    /**
     * Fetch encrypted payload from object storage URL.
     *
     * The SDK stores the payload as raw bytes with Content-Type: text/plain.
     * Some object storage providers base64-encode binary content when returning
     * it as text, so we attempt base64 decode for text responses before falling
     * back to raw bytes.
     */
    private async fetchObjectStoragePayload(getUrl: string): Promise<Uint8Array> {
        try {
            const response = await fetch(getUrl);
            if (!response.ok) {
                throw new WalletKitError(
                    ERROR_CODES.VALIDATION_ERROR,
                    `Object storage fetch failed: ${response.status} ${response.statusText}`,
                );
            }

            const contentType = response.headers.get('content-type') || '';
            const buffer = await response.arrayBuffer();
            const raw = new Uint8Array(buffer);

            if (contentType.includes('text')) {
                const text = new TextDecoder().decode(raw).trim();
                if (/^[A-Za-z0-9+/=_-]+$/.test(text) && text.length > 24) {
                    try {
                        return this.base64ToBytes(text);
                    } catch {
                        // Not valid base64, fall through to raw bytes
                    }
                }
            }

            return raw;
        } catch (error) {
            if (error instanceof WalletKitError) throw error;
            throw new WalletKitError(
                ERROR_CODES.VALIDATION_ERROR,
                `Failed to fetch intent payload from object storage: ${(error as Error).message}`,
                error as Error,
            );
        }
    }

    private base64ToBytes(b64: string): Uint8Array {
        // Handle base64url encoding
        let base64 = b64.replace(/-/g, '+').replace(/_/g, '/');
        const padding = base64.length % 4;
        if (padding) base64 += '='.repeat(4 - padding);

        if (typeof atob === 'function') {
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        }
        return new Uint8Array(Buffer.from(base64, 'base64'));
    }

    /**
     * Decrypt an object storage payload using NaCl crypto_box.
     * Format: nonce (24 bytes) || ciphertext
     *
     * The SDK self-encrypts using the ephemeral keypair it puts in `pk`:
     *   nacl.box(payload, nonce, ephemeralPub, ephemeralSec)
     * So we derive the public key from `pk` and open with the same keypair.
     */
    private decryptPayload(encrypted: Uint8Array, walletPrivateKeyHex: string): string {
        if (encrypted.length <= 24) {
            throw new WalletKitError(
                ERROR_CODES.VALIDATION_ERROR,
                `Encrypted payload too short (${encrypted.length} bytes, need >24)`,
            );
        }

        const walletPrivateKey = this.hexToBytes(walletPrivateKeyHex);

        if (walletPrivateKey.length !== 32) {
            throw new WalletKitError(
                ERROR_CODES.VALIDATION_ERROR,
                `Invalid wallet private key length: ${walletPrivateKey.length} (expected 32)`,
            );
        }

        // Derive the public key from the private key — the SDK encrypted for this same keypair
        const walletPublicKey = nacl.box.keyPair.fromSecretKey(walletPrivateKey).publicKey;

        const nonce = encrypted.slice(0, 24);
        const ciphertext = encrypted.slice(24);
        const decrypted = nacl.box.open(ciphertext, nonce, walletPublicKey, walletPrivateKey);
        if (!decrypted) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Failed to decrypt intent payload');
        }

        return new TextDecoder().decode(decrypted);
    }

    private hexToBytes(hex: string): Uint8Array {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        return bytes;
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

    private validateRequest(request: SpecIntentRequest): void {
        if (!request.id) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Intent request missing id');
        }
        if (!request.method || !VALID_METHODS.includes(request.method)) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, `Invalid intent method: ${request.method}`);
        }

        switch (request.method) {
            case 'txDraft':
            case 'signMsgDraft':
                this.validateTransactionItems(request);
                break;
            case 'signData':
                this.validateSignData(request);
                break;
            case 'actionDraft':
                this.validateAction(request);
                break;
        }
    }

    private validateTransactionItems(request: SpecIntentRequest): void {
        const params = request.params as TxDraftParams;
        if (!params?.i || !Array.isArray(params.i) || params.i.length === 0) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Transaction intent missing items (i)');
        }
        for (const item of params.i) {
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

    private validateSignData(request: SpecIntentRequest): void {
        const params = request.params as SignDataParams;
        if (!Array.isArray(params) || !params[0]) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Sign data intent missing payload');
        }
        let raw: Record<string, unknown>;
        try {
            raw = JSON.parse(params[0]) as Record<string, unknown>;
        } catch {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Invalid JSON in sign data payload');
        }
        if (!raw.type) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Sign data intent missing type');
        }
    }

    private validateAction(request: SpecIntentRequest): void {
        const params = request.params as ActionDraftParams;
        if (!params?.url) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Action intent missing url');
        }
        try {
            const parsed = new URL(params.url);
            if (parsed.protocol !== 'https:') {
                throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Action URL must use HTTPS');
            }
        } catch (error) {
            if (error instanceof WalletKitError) throw error;
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Action intent url is not a valid URL');
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

        const base: IntentRequestBase = {
            id: sourceEvent.id,
            origin: sourceEvent.origin,
            clientId: sourceEvent.clientId,
            from: sourceEvent.from,
            traceId: sourceEvent.traceId,
        };

        switch (action_type) {
            case 'sendTransaction':
                return this.parseActionTransaction(base, action);
            case 'signMessage':
                return this.parseActionTransaction(base, action, 'signOnly');
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
        base: IntentRequestBase,
        action: Record<string, unknown>,
        deliveryMode: IntentDeliveryMode = 'send',
    ): IntentRequestEvent {
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

        const network: Network | undefined = action.network ? { chainId: action.network as string } : undefined;

        const resolvedTransaction: TransactionRequest = {
            messages,
            network,
            validUntil: (action.valid_until ?? action.validUntil) as number | undefined,
        };

        return {
            type: 'transaction' as const,
            ...base,
            deliveryMode,
            network,
            validUntil: resolvedTransaction.validUntil,
            items: [],
            resolvedTransaction,
        };
    }

    private parseActionSignData(
        base: IntentRequestBase,
        action: Record<string, unknown>,
        actionUrl: string,
    ): IntentRequestEvent {
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
            type: 'signData' as const,
            ...base,
            network: action.network ? { chainId: action.network as string } : undefined,
            manifestUrl: actionUrl,
            payload: this.wirePayloadToSignDataPayload(wirePayload),
        };
    }

    // -- Wire → Model mapping -------------------------------------------------

    private toIntentEvent(parsed: ParsedIntentUrl): { event: IntentRequestEvent; connectRequest?: ConnectRequest } {
        const { clientId, from, request, connectRequest, origin, traceId } = parsed;

        const base: IntentRequestBase = {
            id: request.id,
            origin,
            clientId,
            from,
            traceId,
            returnStrategy: undefined,
        };

        let event: IntentRequestEvent;

        switch (request.method) {
            case 'txDraft':
            case 'signMsgDraft': {
                const params = request.params as TxDraftParams;
                const deliveryMode: IntentDeliveryMode = request.method === 'txDraft' ? 'send' : 'signOnly';
                event = {
                    type: 'transaction' as const,
                    ...base,
                    deliveryMode,
                    network: params.n ? { chainId: params.n } : undefined,
                    validUntil: params.vu,
                    items: this.mapItems(params.i),
                };
                break;
            }
            case 'signData': {
                const params = request.params as SignDataParams;
                let raw: Record<string, unknown>;
                try {
                    raw = JSON.parse(params[0]) as Record<string, unknown>;
                } catch (error) {
                    throw new WalletKitError(
                        ERROR_CODES.VALIDATION_ERROR,
                        'Invalid JSON in sign data payload',
                        error as Error,
                    );
                }
                event = {
                    type: 'signData' as const,
                    ...base,
                    network: raw.network ? { chainId: raw.network as string } : undefined,
                    manifestUrl: connectRequest?.manifestUrl || '',
                    payload: this.wirePayloadToSignDataPayload({
                        type: raw.type as string,
                        text: raw.text as string | undefined,
                        bytes: raw.bytes as string | undefined,
                        cell: raw.cell as string | undefined,
                        schema: raw.schema as string | undefined,
                    }),
                };
                break;
            }
            case 'actionDraft': {
                const params = request.params as ActionDraftParams;
                event = {
                    type: 'action' as const,
                    ...base,
                    actionUrl: params.url,
                };
                break;
            }
            default:
                throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, `Unhandled intent method: ${request.method}`);
        }

        return { event, connectRequest };
    }

    private mapItems(wireItems: WireIntentItem[]): IntentActionItem[] {
        return wireItems.map((item) => this.mapItem(item));
    }

    private mapItem(item: WireIntentItem): IntentActionItem {
        switch (item.t) {
            case 'ton':
                if (!item.a) throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'TON item missing address (a)');
                if (!item.am) throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'TON item missing amount (am)');
                return {
                    type: 'sendTon' as const,
                    address: item.a,
                    amount: item.am,
                    payload: item.p as Base64String | undefined,
                    stateInit: item.si as Base64String | undefined,
                    extraCurrency: item.ec,
                };
            case 'jetton':
                if (!item.ma)
                    throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Jetton item missing master address (ma)');
                if (!item.ja) throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Jetton item missing amount (ja)');
                if (!item.d)
                    throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Jetton item missing destination (d)');
                return {
                    type: 'sendJetton' as const,
                    jettonMasterAddress: item.ma,
                    jettonAmount: item.ja,
                    destination: item.d,
                    responseDestination: item.rd,
                    customPayload: item.cp as Base64String | undefined,
                    forwardTonAmount: item.fta,
                    forwardPayload: item.fp as Base64String | undefined,
                    queryId: item.qi,
                };
            case 'nft':
                if (!item.na) throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'NFT item missing address (na)');
                if (!item.no) throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'NFT item missing new owner (no)');
                return {
                    type: 'sendNft' as const,
                    nftAddress: item.na,
                    newOwnerAddress: item.no,
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
