/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * IntentHandler - Handles TonConnect intent deep links
 *
 * Parses and processes intent URLs (tc://intent_inline?...) that allow
 * dApps to request actions without a prior TonConnect session.
 */

import { Address } from '@ton/core';
import { sha256_sync } from '@ton/crypto';
import type { ConnectRequest } from '@tonconnect/protocol';

import { globalLogger } from './Logger';
import type { WalletManager } from './WalletManager';
import type { EventEmitter } from './EventEmitter';
import type { RequestProcessor } from './RequestProcessor';
import { WalletKitError, ERROR_CODES } from '../errors';
import type { Wallet } from '../api/interfaces';
import type {
    IntentRequest,
    IntentMethod,
    ParsedIntentUrl,
    IntentEvent,
    TransactionIntentEvent,
    SignDataIntentEvent,
    ActionIntentEvent,
    SendTransactionIntentRequest,
    SignMessageIntentRequest,
    SignDataIntentRequest,
    SendActionIntentRequest,
    IntentItem,
    SendTonIntentItem,
    SendJettonIntentItem,
    SendNftIntentItem,
    IntentTransactionResponseSuccess,
    IntentSignDataResponseSuccess,
    IntentResponseError,
    IntentResponse,
    SignDataIntentPayload,
    ActionUrlResponse,
    SendTransactionAction,
    SignDataAction,
    ActionTransactionMessage,
} from '../types/intents';
import type { TransactionRequest, TransactionRequestMessage, PreparedSignData, SignData } from '../api/models';
import type { Base64String, Hex } from '../api/models/core/Primitives';
import type {
    ConnectionRequestEvent,
    ConnectionRequestEventRequestedItem,
    ConnectionRequestEventPreviewPermission,
} from '../api/models/bridge/ConnectionRequestEvent';
import type { ConnectionApprovalProof } from '../api/models/bridge/ConnectionApprovalResponse';

const log = globalLogger.createChild('IntentHandler');

/**
 * Intent URL schemes
 */
const INTENT_INLINE_SCHEME = 'tc://intent_inline';
const INTENT_SCHEME = 'tc://intent';

/**
 * Intent error codes (from spec)
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
 * Handles TonConnect intent deep links
 */
export class IntentHandler {
    constructor(
        private walletManager: WalletManager,
        private eventEmitter: EventEmitter,
        private requestProcessor: RequestProcessor,
    ) {}

    // ========================================================================
    // URL Parsing
    // ========================================================================

    /**
     * Check if a URL is an intent URL
     */
    isIntentUrl(url: string): boolean {
        const normalizedUrl = url.trim().toLowerCase();
        return normalizedUrl.startsWith(INTENT_INLINE_SCHEME) || normalizedUrl.startsWith(INTENT_SCHEME);
    }

    /**
     * Parse an intent URL and extract the request payload
     */
    parseIntentUrl(url: string): ParsedIntentUrl {
        log.debug('Parsing intent URL', { url });

        try {
            const parsedUrl = new URL(url);

            // Get client ID (public key)
            const clientId = parsedUrl.searchParams.get('id');
            if (!clientId) {
                throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Missing client ID (id) in intent URL');
            }

            // Check if it's inline (Approach 2) or storage-based (Approach 1)
            if (url.toLowerCase().startsWith(INTENT_INLINE_SCHEME)) {
                return this.parseInlineIntent(parsedUrl, clientId);
            } else {
                // Approach 1 with object storage - not implemented yet
                throw new WalletKitError(
                    ERROR_CODES.VALIDATION_ERROR,
                    'Object storage intents (Approach 1) are not yet supported. Use intent_inline instead.',
                );
            }
        } catch (error) {
            if (error instanceof WalletKitError) {
                throw error;
            }
            log.error('Failed to parse intent URL', { error, url });
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Invalid intent URL format', error as Error, {
                url,
            });
        }
    }

    /**
     * Parse inline intent (Approach 2: URL-Embedded Data)
     *
     * The `r` parameter can be encoded in two ways:
     * 1. base64url(json.stringify(payload)) - standard spec format
     * 2. encodeURIComponent(json.stringify(payload)) - URL-encoded JSON
     *
     * We detect the format by checking if the payload starts with characters
     * that look like JSON (after URL decoding) or base64url.
     */
    private parseInlineIntent(parsedUrl: URL, clientId: string): ParsedIntentUrl {
        const encodedPayload = parsedUrl.searchParams.get('r');
        if (!encodedPayload) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Missing payload (r) in intent URL');
        }

        // Try to decode the payload - detect format automatically
        const jsonPayload = this.decodeIntentPayload(encodedPayload);
        log.debug('Decoded intent payload', { jsonPayload });

        // Parse JSON to IntentRequest
        let request: IntentRequest;
        try {
            request = JSON.parse(jsonPayload) as IntentRequest;
        } catch (error) {
            throw new WalletKitError(
                ERROR_CODES.VALIDATION_ERROR,
                'Invalid JSON in intent payload',
                error as Error,
            );
        }

        // Validate the request
        this.validateIntentRequest(request);

        return {
            clientId,
            request,
        };
    }

    /**
     * Decode intent payload - handles both URL-encoded JSON and base64url formats
     *
     * Detection logic:
     * - If the string starts with `%7B` or `{`, it's URL-encoded JSON
     * - Otherwise, try base64url decoding
     */
    private decodeIntentPayload(encoded: string): string {
        // Check if it's URL-encoded JSON (starts with %7B which is `{` URL-encoded)
        // or already decoded JSON (starts with `{`)
        if (encoded.startsWith('%7B') || encoded.startsWith('%257B') || encoded.startsWith('{')) {
            // URL-encoded JSON - decode it
            // Handle double-encoding (%25 = %)
            let decoded = decodeURIComponent(encoded);
            // Check if still URL-encoded (double-encoding case)
            if (decoded.startsWith('%7B') || decoded.startsWith('%')) {
                decoded = decodeURIComponent(decoded);
            }
            return decoded;
        }

        // Try base64url decoding
        return this.decodeBase64Url(encoded);
    }

    /**
     * Decode base64url to string
     */
    private decodeBase64Url(encoded: string): string {
        // Replace URL-safe characters with standard base64 characters
        let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');

        // Add padding if necessary
        const padding = base64.length % 4;
        if (padding) {
            base64 += '='.repeat(4 - padding);
        }

        // Decode
        if (typeof atob === 'function') {
            return atob(base64);
        } else {
            // Node.js environment
            return Buffer.from(base64, 'base64').toString('utf-8');
        }
    }

    /**
     * Validate an intent request
     */
    private validateIntentRequest(request: IntentRequest): void {
        if (!request.id) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Intent request missing id');
        }

        if (!request.m) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Intent request missing method (m)');
        }

        const validMethods: IntentMethod[] = ['txIntent', 'signMsg', 'signIntent', 'actionIntent'];
        if (!validMethods.includes(request.m)) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, `Unknown intent method: ${request.m}`);
        }

        // Validate specific intent types
        switch (request.m) {
            case 'txIntent':
            case 'signMsg':
                this.validateTransactionIntent(request);
                break;
            case 'signIntent':
                this.validateSignDataIntent(request);
                break;
            case 'actionIntent':
                this.validateActionIntent(request);
                break;
        }
    }

    private validateTransactionIntent(request: SendTransactionIntentRequest | SignMessageIntentRequest): void {
        if (!request.i || !Array.isArray(request.i) || request.i.length === 0) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Intent missing items (i)');
        }

        // Validate each item
        for (const item of request.i) {
            if (!item.t) {
                throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Intent item missing type (t)');
            }

            const validTypes = ['ton', 'jetton', 'nft'];
            if (!validTypes.includes(item.t)) {
                throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, `Unknown intent item type: ${item.t}`);
            }

            this.validateIntentItem(item);
        }
    }

    private validateIntentItem(item: IntentItem): void {
        switch (item.t) {
            case 'ton': {
                const tonItem = item as SendTonIntentItem;
                if (!tonItem.a) {
                    throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'TON intent item missing address (a)');
                }
                if (!tonItem.am) {
                    throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'TON intent item missing amount (am)');
                }
                break;
            }
            case 'jetton': {
                const jettonItem = item as SendJettonIntentItem;
                if (!jettonItem.ma) {
                    throw new WalletKitError(
                        ERROR_CODES.VALIDATION_ERROR,
                        'Jetton intent item missing master address (ma)',
                    );
                }
                if (!jettonItem.ja) {
                    throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Jetton intent item missing amount (ja)');
                }
                if (!jettonItem.d) {
                    throw new WalletKitError(
                        ERROR_CODES.VALIDATION_ERROR,
                        'Jetton intent item missing destination (d)',
                    );
                }
                break;
            }
            case 'nft': {
                const nftItem = item as SendNftIntentItem;
                if (!nftItem.na) {
                    throw new WalletKitError(
                        ERROR_CODES.VALIDATION_ERROR,
                        'NFT intent item missing NFT address (na)',
                    );
                }
                if (!nftItem.no) {
                    throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'NFT intent item missing new owner (no)');
                }
                break;
            }
        }
    }

    private validateSignDataIntent(request: SignDataIntentRequest): void {
        // Manifest URL can be in `mu` or `c.manifestUrl`
        const manifestUrl = request.mu || request.c?.manifestUrl;
        if (!manifestUrl) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Sign data intent missing manifest URL (mu or c.manifestUrl)');
        }
        if (!request.p) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Sign data intent missing payload (p)');
        }
        if (!request.p.type) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Sign data payload missing type');
        }
    }

    private validateActionIntent(request: SendActionIntentRequest): void {
        if (!request.a) {
            throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Action intent missing action URL (a)');
        }
    }

    // ========================================================================
    // Intent Processing
    // ========================================================================

    /**
     * Handle an intent URL
     * Parses the URL and emits an intent event for the wallet UI
     */
    async handleIntentUrl(url: string): Promise<void> {
        log.info('Handling intent URL', { url });

        const parsed = this.parseIntentUrl(url);
        const event = this.createIntentEvent(parsed);

        // Emit the intent event for wallet UI to handle
        this.eventEmitter.emit('intent', event);

        log.info('Intent event emitted', { type: event.type, id: event.id });
    }

    /**
     * Create an intent event from parsed URL
     */
    private createIntentEvent(parsed: ParsedIntentUrl): IntentEvent {
        const { clientId, request } = parsed;
        const hasConnectRequest = !!request.c;

        const baseEvent = {
            id: request.id,
            clientId,
            hasConnectRequest,
            connectRequest: request.c,
        };

        switch (request.m) {
            case 'txIntent':
            case 'signMsg': {
                const txRequest = request as SendTransactionIntentRequest | SignMessageIntentRequest;
                return {
                    ...baseEvent,
                    type: request.m,
                    network: txRequest.n,
                    validUntil: txRequest.vu,
                    items: txRequest.i,
                } as TransactionIntentEvent;
            }
            case 'signIntent': {
                const signRequest = request as SignDataIntentRequest;
                // Manifest URL can be in `mu` or `c.manifestUrl`
                const manifestUrl = signRequest.mu || signRequest.c?.manifestUrl || '';
                return {
                    ...baseEvent,
                    type: 'signIntent',
                    network: signRequest.n,
                    manifestUrl,
                    payload: signRequest.p,
                } as SignDataIntentEvent;
            }
            case 'actionIntent': {
                const actionRequest = request as SendActionIntentRequest;
                return {
                    ...baseEvent,
                    type: 'actionIntent',
                    actionUrl: actionRequest.a,
                } as ActionIntentEvent;
            }
        }
    }

    // ========================================================================
    // Intent Approval/Rejection
    // ========================================================================

    /**
     * Approve a transaction intent (txIntent)
     *
     * Signs and sends the transaction to the blockchain,
     * then returns the signed BoC for the dApp to verify.
     *
     * @param event - The transaction intent event
     * @param walletId - The wallet to use for signing
     * @returns The approval response with signed BoC
     */
    async approveTransactionIntent(
        event: TransactionIntentEvent,
        walletId: string,
    ): Promise<IntentTransactionResponseSuccess> {
        log.info('Approving transaction intent', { id: event.id, walletId, type: event.type });

        const wallet = this.walletManager.getWallet(walletId);
        if (!wallet) {
            throw new WalletKitError(ERROR_CODES.WALLET_NOT_FOUND, `Wallet not found: ${walletId}`);
        }

        // Convert intent items to transaction request
        const transactionRequest = await this.intentItemsToTransactionRequest(
            event.items,
            wallet,
            event.network,
            event.validUntil,
        );

        // Sign the transaction
        const signedBoc = await wallet.getSignedSendTransaction(transactionRequest);

        // For txIntent, send to blockchain
        if (event.type === 'txIntent') {
            // Use the wallet's API client
            await wallet.client.sendBoc(signedBoc);
            log.info('Transaction sent to blockchain', { id: event.id });
        }

        // Note: signMsg type does NOT send to blockchain - that's the key difference
        // The dApp will use the signed BoC for gasless transaction relaying

        const response: IntentTransactionResponseSuccess = {
            result: signedBoc,
            id: event.id,
        };

        log.info('Intent approved successfully', { id: event.id, type: event.type });
        return response;
    }

    /**
     * Approve a sign data intent (signIntent)
     *
     * Signs the data and returns the signature.
     *
     * @param event - The sign data intent event
     * @param walletId - The wallet to use for signing
     * @returns The approval response with signature
     */
    async approveSignDataIntent(
        event: SignDataIntentEvent,
        walletId: string,
    ): Promise<IntentSignDataResponseSuccess> {
        log.info('Approving sign data intent', { id: event.id, walletId });

        const wallet = this.walletManager.getWallet(walletId);
        if (!wallet) {
            throw new WalletKitError(ERROR_CODES.WALLET_NOT_FOUND, `Wallet not found: ${walletId}`);
        }

        // Get wallet address
        const address = wallet.getAddress().toString();
        const timestamp = Math.floor(Date.now() / 1000);

        // Extract domain from manifest URL
        const domain = new URL(event.manifestUrl).hostname;

        // Convert intent payload to SignData format
        let signData: SignData;
        switch (event.payload.type) {
            case 'text':
                signData = { type: 'text', value: { content: event.payload.text } };
                break;
            case 'binary':
                signData = { type: 'binary', value: { content: event.payload.bytes as Base64String } };
                break;
            case 'cell':
                signData = { type: 'cell', value: { schema: event.payload.schema, content: event.payload.cell as Base64String } };
                break;
        }

        // Build PreparedSignData
        const dataToHash = JSON.stringify({ address, timestamp, domain, payload: signData });
        const dataHash = sha256_sync(dataToHash).toString('hex');

        const preparedSignData: PreparedSignData = {
            address,
            timestamp,
            domain,
            payload: {
                network: event.network ? { chainId: event.network } : undefined,
                data: signData,
            },
            hash: `0x${dataHash}` as Hex,
        };

        // Sign the data
        const signature = await wallet.getSignedSignData(preparedSignData);

        const response: IntentSignDataResponseSuccess = {
            result: {
                signature,
                address,
                timestamp,
                domain,
                payload: event.payload,
            },
            id: event.id,
        };

        log.info('Sign data intent approved', { id: event.id });
        return response;
    }

    /**
     * Approve an action intent (actionIntent)
     *
     * Fetches action details from the action URL, then executes the appropriate action.
     * The action URL should return a JSON object with action_type and action fields.
     *
     * @param event - The action intent event
     * @param walletId - The wallet to use for the action
     * @returns The approval response (either transaction or sign data response)
     */
    async approveActionIntent(
        event: ActionIntentEvent,
        walletId: string,
    ): Promise<IntentTransactionResponseSuccess | IntentSignDataResponseSuccess> {
        log.info('Approving action intent', { id: event.id, walletId, actionUrl: event.actionUrl });

        const wallet = this.walletManager.getWallet(walletId);
        if (!wallet) {
            throw new WalletKitError(ERROR_CODES.WALLET_NOT_FOUND, `Wallet not found: ${walletId}`);
        }

        // Build the action URL with address parameter
        const walletAddress = wallet.getAddress().toString();
        const actionUrlWithAddress = new URL(event.actionUrl);
        actionUrlWithAddress.searchParams.set('address', walletAddress);

        // Fetch action details from the URL
        let actionResponse: ActionUrlResponse;
        try {
            const response = await fetch(actionUrlWithAddress.toString());
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            actionResponse = await response.json() as ActionUrlResponse;
        } catch (error) {
            throw new WalletKitError(
                ERROR_CODES.NETWORK_ERROR,
                `Failed to fetch action from URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }

        // Validate action response
        if (!actionResponse.action_type || !actionResponse.action) {
            throw new WalletKitError(
                ERROR_CODES.VALIDATION_ERROR,
                'Invalid action response: missing action_type or action',
            );
        }

        // Execute based on action type
        switch (actionResponse.action_type) {
            case 'sendTransaction': {
                // Build transaction request from action
                const txAction = actionResponse.action as SendTransactionAction;
                const transactionRequest: TransactionRequest = {
                    messages: txAction.messages.map((msg: ActionTransactionMessage) => ({
                        address: msg.address,
                        amount: msg.amount,
                        payload: msg.payload as Base64String | undefined,
                        stateInit: msg.stateInit as Base64String | undefined,
                        extraCurrency: msg.extra_currency,
                    })),
                    network: txAction.network ? { chainId: txAction.network } : undefined,
                    validUntil: txAction.valid_until,
                };

                // Sign and send
                const signedBoc = await wallet.getSignedSendTransaction(transactionRequest);
                await wallet.client.sendBoc(signedBoc);

                log.info('Action intent (sendTransaction) approved', { id: event.id });
                return { result: signedBoc, id: event.id };
            }

            case 'signData': {
                // Build sign data event from action
                const signAction = actionResponse.action as SignDataAction;
                
                // Determine the manifest URL for domain binding:
                // 1. Use from connectRequest if available
                // 2. Otherwise use action URL origin as fallback
                let manifestUrl = event.actionUrl;
                if (event.connectRequest?.manifestUrl) {
                    manifestUrl = event.connectRequest.manifestUrl;
                } else {
                    // Use action URL origin as the manifest URL (proper domain binding)
                    try {
                        const actionOrigin = new URL(event.actionUrl);
                        manifestUrl = `${actionOrigin.origin}/tonconnect-manifest.json`;
                    } catch (_) {
                        // Keep original action URL if parsing fails
                    }
                }

                // Create a synthetic sign data event
                const signDataEvent: SignDataIntentEvent = {
                    id: event.id,
                    clientId: event.clientId,
                    hasConnectRequest: event.hasConnectRequest,
                    connectRequest: event.connectRequest,
                    type: 'signIntent',
                    network: signAction.network,
                    manifestUrl,
                    payload: signAction as SignDataIntentPayload,
                };

                return this.approveSignDataIntent(signDataEvent, walletId);
            }

            default:
                throw new WalletKitError(
                    ERROR_CODES.VALIDATION_ERROR,
                    `Unknown action type: ${actionResponse.action_type}`,
                );
        }
    }

    /**
     * Reject an intent request
     *
     * @param event - The intent event to reject
     * @param reason - Optional rejection reason
     * @param errorCode - Optional error code (defaults to USER_DECLINED)
     * @returns The rejection response
     */
    rejectIntent(
        event: IntentEvent,
        reason?: string,
        errorCode?: IntentErrorCode,
    ): IntentResponseError {
        log.info('Rejecting intent', { id: event.id, reason });

        const response: IntentResponseError = {
            error: {
                code: errorCode ?? INTENT_ERROR_CODES.USER_DECLINED,
                message: reason ?? 'User declined the request',
            },
            id: event.id,
        };

        return response;
    }

    /**
     * Process connect request after intent approval
     *
     * This creates a proper ConnectionRequestEvent from the intent's ConnectRequest
     * and uses the existing connection infrastructure to establish a session.
     *
     * @param event - The intent event with connect request
     * @param walletId - The wallet to use for the connection
     * @param proof - Optional proof response (signature, timestamp, domain, payload)
     */
    async processConnectAfterIntent(
        event: IntentEvent,
        walletId: string,
        proof?: ConnectionApprovalProof,
    ): Promise<void> {
        if (!event.hasConnectRequest || !event.connectRequest) {
            log.info('No connect request to process', { id: event.id });
            return;
        }

        log.info('Processing connect request after intent', {
            id: event.id,
            walletId,
            manifestUrl: event.connectRequest.manifestUrl,
        });

        const wallet = this.walletManager.getWallet(walletId);
        if (!wallet) {
            throw new WalletKitError(ERROR_CODES.WALLET_NOT_FOUND, `Wallet not found: ${walletId}`);
        }

        // Create ConnectionRequestEvent from the ConnectRequest
        const connectRequest = event.connectRequest;
        
        // Build requested items
        const requestedItems: ConnectionRequestEventRequestedItem[] = [];
        if (connectRequest.items) {
            for (const item of connectRequest.items) {
                if (item.name === 'ton_addr') {
                    requestedItems.push({ type: 'ton_addr' });
                } else if (item.name === 'ton_proof' && 'payload' in item) {
                    requestedItems.push({
                        type: 'ton_proof',
                        value: { payload: item.payload as string },
                    });
                }
            }
        }

        // Fetch manifest for dApp info
        let manifest: { name?: string; url?: string; iconUrl?: string; description?: string } | null = null;
        const manifestUrl = connectRequest.manifestUrl;
        
        if (manifestUrl) {
            try {
                const response = await fetch(manifestUrl);
                if (response.ok) {
                    manifest = await response.json();
                }
            } catch (error) {
                log.warn('Failed to fetch manifest for intent connect', { error, manifestUrl });
            }
        }

        // Extract domain from manifest URL
        let domain = '';
        if (manifestUrl) {
            try {
                domain = new URL(manifestUrl).hostname;
            } catch (_) {
                // ignore
            }
        }

        // Build permissions
        const permissions: ConnectionRequestEventPreviewPermission[] = [];
        if (requestedItems.some(item => item.type === 'ton_addr')) {
            permissions.push({
                name: 'ton_addr',
                title: 'TON Address',
                description: 'Gives dApp information about your TON address',
            });
        }
        if (requestedItems.some(item => item.type === 'ton_proof')) {
            permissions.push({
                name: 'ton_proof',
                title: 'TON Proof',
                description: 'Gives dApp signature that can be used to verify your access to private key',
            });
        }

        // Create the ConnectionRequestEvent
        const connectionRequestEvent: ConnectionRequestEvent = {
            id: `intent-connect-${event.id}`,
            from: event.clientId,
            walletId: walletId,
            walletAddress: wallet.getAddress(),
            domain: domain,
            isJsBridge: false,
            requestedItems,
            preview: {
                permissions,
                dAppInfo: {
                    url: manifest?.url || domain,
                    name: manifest?.name || domain,
                    description: manifest?.description,
                    iconUrl: manifest?.iconUrl,
                    manifestUrl: manifestUrl,
                },
            },
            dAppInfo: {
                url: manifest?.url || domain,
                name: manifest?.name || domain,
                description: manifest?.description,
                iconUrl: manifest?.iconUrl,
                manifestUrl: manifestUrl,
            },
        };

        // Use the RequestProcessor to approve the connect request
        // This will create a session and send the response via the bridge
        await this.requestProcessor.approveConnectRequest(connectionRequestEvent, proof ? { proof } : undefined);

        log.info('Connect request processed after intent', { id: event.id });
    }

    // ========================================================================
    // Intent Item Conversion
    // ========================================================================

    /**
     * Convert intent items to transaction request messages
     * @param items - Intent items to convert
     * @param wallet - Wallet to use for jetton wallet address resolution
     * @param network - Optional network chain ID
     * @param validUntil - Optional validity timestamp
     */
    async intentItemsToTransactionRequest(
        items: IntentItem[],
        wallet: Wallet,
        network?: string,
        validUntil?: number,
    ): Promise<TransactionRequest> {
        const messages: TransactionRequestMessage[] = [];
        const walletAddress = wallet.getAddress().toString();

        for (const item of items) {
            const message = await this.intentItemToMessage(item, wallet, walletAddress);
            messages.push(message);
        }

        return {
            messages,
            network: network ? { chainId: network } : undefined,
            validUntil: validUntil ?? Math.floor(Date.now() / 1000) + 300,
        };
    }

    /**
     * Convert a single intent item to a transaction message
     */
    private async intentItemToMessage(
        item: IntentItem,
        wallet: Wallet,
        walletAddress: string,
    ): Promise<TransactionRequestMessage> {
        switch (item.t) {
            case 'ton':
                return this.tonIntentToMessage(item);
            case 'jetton':
                return this.jettonIntentToMessage(item, wallet, walletAddress);
            case 'nft':
                return this.nftIntentToMessage(item, walletAddress);
            default:
                throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, `Unknown intent item type: ${(item as IntentItem).t}`);
        }
    }

    /**
     * Convert TON intent item to message
     */
    private tonIntentToMessage(item: SendTonIntentItem): TransactionRequestMessage {
        return {
            address: item.a,
            amount: item.am,
            payload: item.p as Base64String | undefined,
            stateInit: item.si as Base64String | undefined,
            extraCurrency: item.ec ? (item.ec as Record<number, string>) : undefined,
        };
    }

    /**
     * Convert Jetton intent item to message
     * Builds the jetton transfer message body
     */
    private async jettonIntentToMessage(
        item: SendJettonIntentItem,
        wallet: Wallet,
        walletAddress: string,
    ): Promise<TransactionRequestMessage> {
        const { beginCell, Cell } = await import('@ton/core');

        log.info('jettonIntentToMessage v2 - using Cell.fromBase64', { 
            hasFp: !!item.fp, 
            hasCp: !!item.cp,
            fpLength: item.fp?.length ?? 0 
        });

        // Build jetton transfer body according to TEP-74
        // Note: fp and cp are base64-encoded BoC (Bag of Cells), not raw bytes
        const forwardPayloadCell = item.fp ? Cell.fromBase64(item.fp) : null;
        const customPayloadCell = item.cp ? Cell.fromBase64(item.cp) : null;

        log.info('Payload cells created', {
            fpBits: forwardPayloadCell?.bits.length ?? 0,
            cpBits: customPayloadCell?.bits.length ?? 0,
        });

        const body = beginCell()
            .storeUint(0xf8a7ea5, 32) // op: transfer
            .storeUint(item.qi ?? 0, 64) // query_id
            .storeCoins(BigInt(item.ja)) // amount
            .storeAddress(Address.parse(item.d)) // destination
            .storeAddress(item.rd ? Address.parse(item.rd) : Address.parse(walletAddress)) // response_destination
            .storeMaybeRef(customPayloadCell) // custom_payload (already a Cell)
            .storeCoins(BigInt(item.fta ?? '0')) // forward_ton_amount
            .storeMaybeRef(forwardPayloadCell) // forward_payload (already a Cell)
            .endCell();

        log.info('Jetton transfer body built', { bits: body.bits.length, refs: body.refs.length });

        // Get jetton wallet address for the user using the wallet's method
        const jettonWalletAddress = await wallet.getJettonWalletAddress(item.ma);

        // Default amount for jetton transfer fee
        const feeAmount = item.fta ? BigInt(item.fta) + BigInt(50000000) : BigInt(50000000); // 0.05 TON + forward

        return {
            address: jettonWalletAddress,
            amount: feeAmount.toString(),
            payload: body.toBoc().toString('base64') as Base64String,
        };
    }

    /**
     * Convert NFT intent item to message
     * Builds the NFT transfer message body
     */
    private async nftIntentToMessage(item: SendNftIntentItem, walletAddress: string): Promise<TransactionRequestMessage> {
        const { beginCell, Cell } = await import('@ton/core');

        // Build NFT transfer body according to TEP-62
        // Note: fp and cp are base64-encoded BoC (Bag of Cells), not raw bytes
        const forwardPayloadCell = item.fp ? Cell.fromBase64(item.fp) : null;
        const customPayloadCell = item.cp ? Cell.fromBase64(item.cp) : null;

        const body = beginCell()
            .storeUint(0x5fcc3d14, 32) // op: transfer
            .storeUint(item.qi ?? 0, 64) // query_id
            .storeAddress(Address.parse(item.no)) // new_owner
            .storeAddress(item.rd ? Address.parse(item.rd) : Address.parse(walletAddress)) // response_destination
            .storeMaybeRef(customPayloadCell) // custom_payload (already a Cell)
            .storeCoins(BigInt(item.fta ?? '0')) // forward_amount
            .storeMaybeRef(forwardPayloadCell) // forward_payload (already a Cell)
            .endCell();

        // Default amount for NFT transfer fee
        const feeAmount = BigInt(50000000); // 0.05 TON

        return {
            address: item.na,
            amount: feeAmount.toString(),
            payload: body.toBoc().toString('base64') as Base64String,
        };
    }
}
