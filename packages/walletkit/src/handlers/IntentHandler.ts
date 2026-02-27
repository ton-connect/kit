/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ConnectRequest } from '@tonconnect/protocol';

import { globalLogger } from '../core/Logger';
import { WalletKitError, ERROR_CODES } from '../errors';
import { CallForSuccess } from '../utils/retry';
import { PrepareSignData } from '../utils/signData/sign';
import { HexToBase64 } from '../utils/base64';
import { IntentParser, INTENT_ERROR_CODES } from './IntentParser';
import { IntentResolver } from './IntentResolver';
import { ConnectHandler } from './ConnectHandler';
import type { BridgeManager } from '../core/BridgeManager';
import type { WalletManager } from '../core/WalletManager';
import type { Wallet } from '../api/interfaces';
import type { RawBridgeEventConnect } from '../types/internal';
import type { AnalyticsManager } from '../analytics';
import type {
    IntentRequestEvent,
    IntentRequestBase,
    TransactionIntentRequestEvent,
    SignDataIntentRequestEvent,
    ActionIntentRequestEvent,
    IntentTransactionResponse,
    IntentSignDataResponse,
    IntentErrorResponse,
    IntentResponseResult,
    IntentActionItem,
    BatchedIntentEvent,
    ConnectionRequestEvent,
    TransactionRequest,
    SignDataPayload,
    Base64String,
    UserFriendlyAddress,
} from '../api/models';
import type { TonWalletKitOptions } from '../types';

const log = globalLogger.createChild('IntentHandler');

type IntentCallback = (event: IntentRequestEvent | BatchedIntentEvent) => void;

/**
 * Orchestrates intent processing: parse → resolve → emulate → emit.
 *
 * Delegates URL parsing to IntentParser, item resolution to IntentResolver,
 * and reuses existing wallet signing/sending utilities for approval.
 */
export class IntentHandler {
    private parser = new IntentParser();
    private resolver = new IntentResolver();
    private callbacks: IntentCallback[] = [];

    constructor(
        private walletKitOptions: TonWalletKitOptions,
        private bridgeManager: BridgeManager,
        private walletManager: WalletManager,
        private analyticsManager?: AnalyticsManager,
    ) {}

    // -- Public: Parsing ------------------------------------------------------

    isIntentUrl(url: string): boolean {
        return this.parser.isIntentUrl(url);
    }

    /**
     * Parse an intent URL, resolve items, emulate preview, and emit the event.
     *
     * When a connect request is present, the result is always a
     * {@link BatchedIntentEvent} with the connect as the first item.
     * Multi-item transaction intents are also batched (one item per action).
     */
    async handleIntentUrl(url: string, walletId: string): Promise<void> {
        const { event, connectRequest } = await this.parser.parse(url);

        // parser.parse() never returns connect events
        if (event.type === 'connect') return;

        // Resolve connect request into a ConnectionRequestEvent if present
        let connectItem: IntentRequestEvent | undefined;
        if (connectRequest) {
            const connectionEvent = await this.resolveConnectRequest(connectRequest, event);
            connectItem = { type: 'connect', value: connectionEvent };
        }

        if (event.type === 'transaction') {
            if (connectItem || event.value.items.length > 1) {
                // Batch when there's a connect or multiple tx items
                await this.resolveAndEmitBatchedTransaction(event, walletId, connectItem);
            } else {
                await this.resolveAndEmitTransaction(event, walletId);
            }
        } else {
            if (connectItem) {
                // Batch: connect + single non-tx intent
                const batch: BatchedIntentEvent = {
                    id: event.value.id,
                    origin: event.value.origin,
                    clientId: event.value.clientId,
                    traceId: event.value.traceId,
                    returnStrategy: event.value.returnStrategy,
                    intents: [connectItem, event],
                };
                this.emit(batch);
            } else {
                this.emit(event);
            }
        }
    }

    // -- Public: Callbacks ----------------------------------------------------

    onIntentRequest(callback: IntentCallback): void {
        this.callbacks.push(callback);
    }

    removeIntentRequestCallback(callback: IntentCallback): void {
        this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    }

    // -- Public: Approval -----------------------------------------------------

    async approveTransactionIntent(
        event: TransactionIntentRequestEvent,
        walletId: string,
    ): Promise<IntentTransactionResponse> {
        const wallet = this.getWallet(walletId);

        const transactionRequest = event.resolvedTransaction ?? (await this.resolveTransaction(event, wallet));

        // signOnly (signMsg) uses internal opcode (0x73696e74) for gasless relaying
        const signedBoc = await wallet.getSignedSendTransaction(transactionRequest, {
            internal: event.deliveryMode === 'signOnly',
        });

        if (event.deliveryMode === 'send' && !this.walletKitOptions.dev?.disableNetworkSend) {
            await CallForSuccess(() => wallet.getClient().sendBoc(signedBoc));
        }

        const result: IntentTransactionResponse = {
            boc: signedBoc as Base64String,
        };

        await this.sendResponse(event, { type: 'transaction', value: result });
        return result;
    }

    /**
     * Approve a batched intent event.
     *
     * Collects all items from the inner transaction events, builds a single
     * combined {@link TransactionRequest}, signs it as one transaction, and
     * sends a single response back to the dApp.
     */
    async approveBatchedIntent(
        batch: BatchedIntentEvent,
        walletId: string,
    ): Promise<IntentTransactionResponse | IntentSignDataResponse> {
        const wallet = this.getWallet(walletId);

        // Collect all items from inner transaction events
        const allItems: IntentActionItem[] = [];
        let deliveryMode: 'send' | 'signOnly' = 'send';
        for (const intent of batch.intents) {
            if (intent.type === 'transaction') {
                allItems.push(...intent.value.items);
                if (intent.value.deliveryMode === 'signOnly') {
                    deliveryMode = 'signOnly';
                }
            }
        }

        // If the batch contains transaction items, process them
        if (allItems.length > 0) {
            // Find network/validUntil from first transaction event
            const firstTx = batch.intents.find((i) => i.type === 'transaction');
            const network = firstTx?.type === 'transaction' ? firstTx.value.network : undefined;
            const validUntil = firstTx?.type === 'transaction' ? firstTx.value.validUntil : undefined;

            // Build combined transaction
            const transactionRequest = await this.resolver.intentItemsToTransactionRequest(
                allItems,
                wallet,
                network,
                validUntil,
            );

            // signOnly (signMsg) uses internal opcode (0x73696e74) for gasless relaying
            const signedBoc = await wallet.getSignedSendTransaction(transactionRequest, {
                internal: deliveryMode === 'signOnly',
            });

            if (deliveryMode === 'send' && !this.walletKitOptions.dev?.disableNetworkSend) {
                await CallForSuccess(() => wallet.getClient().sendBoc(signedBoc));
            }

            const result: IntentTransactionResponse = {
                boc: signedBoc as Base64String,
            };

            // Send one response using the batch's identity
            await this.sendBatchResponse(batch, { type: 'transaction', value: result });
            return result;
        }

        // Check for signData intents
        const signDataIntent = batch.intents.find((i) => i.type === 'signData');
        if (signDataIntent && signDataIntent.type === 'signData') {
            const event = signDataIntent.value;

            let domain = event.manifestUrl;
            try {
                domain = new URL(event.manifestUrl).host;
            } catch {
                // use as-is
            }

            const signData = PrepareSignData({
                payload: event.payload,
                domain,
                address: wallet.getAddress(),
            });

            const signature = await wallet.getSignedSignData(signData);
            const signatureBase64 = HexToBase64(signature);

            const result: IntentSignDataResponse = {
                signature: signatureBase64 as Base64String,
                address: wallet.getAddress() as UserFriendlyAddress,
                timestamp: signData.timestamp,
                domain: signData.domain,
                payload: event.payload,
            };

            await this.sendBatchResponse(batch, { type: 'signData', value: result });
            return result;
        }

        throw new WalletKitError(
            ERROR_CODES.VALIDATION_ERROR,
            'Batched intent contains no transaction or signData items',
        );
    }

    async approveSignDataIntent(event: SignDataIntentRequestEvent, walletId: string): Promise<IntentSignDataResponse> {
        const wallet = this.getWallet(walletId);

        let domain = event.manifestUrl;
        try {
            domain = new URL(event.manifestUrl).host;
        } catch {
            // use as-is
        }

        const signData = PrepareSignData({
            payload: event.payload,
            domain,
            address: wallet.getAddress(),
        });

        const signature = await wallet.getSignedSignData(signData);
        const signatureBase64 = HexToBase64(signature);

        const result: IntentSignDataResponse = {
            signature: signatureBase64 as Base64String,
            address: wallet.getAddress() as UserFriendlyAddress,
            timestamp: signData.timestamp,
            domain: signData.domain,
            payload: event.payload,
        };

        await this.sendResponse(event, { type: 'signData', value: result });
        return result;
    }

    async approveActionIntent(
        event: ActionIntentRequestEvent,
        walletId: string,
    ): Promise<IntentTransactionResponse | IntentSignDataResponse> {
        const wallet = this.getWallet(walletId);

        const actionResponse = await this.resolver.fetchActionUrl(event.actionUrl, wallet.getAddress());
        const resolvedEvent = this.parser.parseActionResponse(actionResponse, event);

        if (resolvedEvent.type === 'transaction') {
            if (resolvedEvent.value.resolvedTransaction) {
                resolvedEvent.value.resolvedTransaction.fromAddress = wallet.getAddress();
            }
            return this.approveTransactionIntent(resolvedEvent.value, walletId);
        } else if (resolvedEvent.type === 'signData') {
            return this.approveSignDataIntent(resolvedEvent.value, walletId);
        }

        throw new WalletKitError(
            ERROR_CODES.VALIDATION_ERROR,
            `Action URL resolved to unsupported intent type: ${resolvedEvent.type}`,
        );
    }

    // -- Public: Rejection ----------------------------------------------------

    async rejectIntent(
        event: IntentRequestEvent | BatchedIntentEvent,
        reason?: string,
        errorCode?: number,
    ): Promise<IntentErrorResponse> {
        const result: IntentErrorResponse = {
            error: {
                code: errorCode ?? INTENT_ERROR_CODES.USER_DECLINED,
                message: reason || 'User declined the request',
            },
        };

        const isBatched = 'intents' in event;
        if (isBatched) {
            await this.sendBatchResponse(event, { type: 'error', value: result });
        } else if (event.type !== 'connect') {
            await this.sendResponse(event.value, { type: 'error', value: result });
        }
        return result;
    }

    // -- Public: Utilities ----------------------------------------------------

    async intentItemsToTransactionRequest(items: IntentActionItem[], walletId: string): Promise<TransactionRequest> {
        const wallet = this.getWallet(walletId);
        return this.resolver.intentItemsToTransactionRequest(items, wallet);
    }

    // -- Private: Resolution & Emulation --------------------------------------

    private async resolveAndEmitTransaction(
        event: Extract<IntentRequestEvent, { type: 'transaction' }>,
        walletId: string,
    ): Promise<void> {
        const txEvent = event.value;
        const wallet = this.getWallet(walletId);

        const transactionRequest = await this.resolveTransaction(txEvent, wallet);
        txEvent.resolvedTransaction = transactionRequest;

        try {
            const preview = await wallet.getTransactionPreview(transactionRequest);
            txEvent.preview = preview;
        } catch (error) {
            log.warn('Failed to emulate transaction preview', { error });
            txEvent.preview = undefined;
        }

        this.emit(event);
    }

    /**
     * Resolve a `ConnectRequest` (manifestUrl + items) into a full
     * `ConnectionRequestEvent` by fetching the manifest.
     */
    private async resolveConnectRequest(
        connectRequest: ConnectRequest,
        event: Exclude<IntentRequestEvent, { type: 'connect' }>,
    ): Promise<ConnectionRequestEvent> {
        const bridgeEvent: RawBridgeEventConnect = {
            from: event.value.clientId || '',
            id: event.value.id,
            method: 'connect',
            params: {
                manifest: { url: connectRequest.manifestUrl },
                items: connectRequest.items,
            },
            timestamp: Date.now(),
            domain: '',
        };

        const connectHandler = new ConnectHandler(
            () => {},
            this.walletKitOptions,
            this.analyticsManager,
        );
        return connectHandler.handle(bridgeEvent);
    }

    /**
     * Split a multi-item transaction intent into per-item events,
     * resolve and emulate each, then emit as a {@link BatchedIntentEvent}.
     *
     * If `connectItem` is provided it is prepended to the batch so the
     * wallet can display the connect alongside the transaction items.
     */
    private async resolveAndEmitBatchedTransaction(
        event: Extract<IntentRequestEvent, { type: 'transaction' }>,
        walletId: string,
        connectItem?: IntentRequestEvent,
    ): Promise<void> {
        const txEvent = event.value;
        const wallet = this.getWallet(walletId);

        const perItemEvents: IntentRequestEvent[] = [];

        for (let i = 0; i < txEvent.items.length; i++) {
            const item = txEvent.items[i];
            const itemEvent: TransactionIntentRequestEvent = {
                id: `${txEvent.id}_${i}`,
                origin: txEvent.origin,
                clientId: txEvent.clientId,
                traceId: txEvent.traceId,
                returnStrategy: txEvent.returnStrategy,
                deliveryMode: txEvent.deliveryMode,
                network: txEvent.network,
                validUntil: txEvent.validUntil,
                items: [item],
            };

            try {
                const resolved = await this.resolveTransaction(itemEvent, wallet);
                itemEvent.resolvedTransaction = resolved;
                const preview = await wallet.getTransactionPreview(resolved);
                itemEvent.preview = preview;
            } catch (error) {
                log.warn('Failed to resolve/emulate batched item', { error, index: i });
            }

            perItemEvents.push({ type: 'transaction', value: itemEvent });
        }

        const intents: IntentRequestEvent[] = [];
        if (connectItem) intents.push(connectItem);
        intents.push(...perItemEvents);

        const batch: BatchedIntentEvent = {
            id: txEvent.id,
            origin: txEvent.origin,
            clientId: txEvent.clientId,
            traceId: txEvent.traceId,
            returnStrategy: txEvent.returnStrategy,
            intents,
        };

        this.emit(batch);
    }

    private async resolveTransaction(
        event: TransactionIntentRequestEvent,
        wallet: Wallet,
    ): Promise<TransactionRequest> {
        return this.resolver.intentItemsToTransactionRequest(event.items, wallet, event.network, event.validUntil);
    }

    // -- Private: Response sending --------------------------------------------

    private async sendResponse(event: IntentRequestBase, result: IntentResponseResult): Promise<void> {
        if (!event.clientId) {
            log.debug('No clientId on intent event, skipping response send');
            return;
        }

        const wireResponse = this.toWireResponse(event.id, result);

        try {
            await this.bridgeManager.sendIntentResponse(event.clientId, wireResponse, event.traceId);
        } catch (error) {
            log.error('Failed to send intent response', { error, eventId: event.id });
        }
    }

    private async sendBatchResponse(batch: BatchedIntentEvent, result: IntentResponseResult): Promise<void> {
        if (!batch.clientId) {
            log.debug('No clientId on batched intent, skipping response send');
            return;
        }

        const wireResponse = this.toWireResponse(batch.id, result);

        try {
            await this.bridgeManager.sendIntentResponse(batch.clientId, wireResponse, batch.traceId);
        } catch (error) {
            log.error('Failed to send batched intent response', { error, batchId: batch.id });
        }
    }

    /**
     * Convert SDK response model to TonConnect wire format.
     * - Transaction: `{ result: "<boc>", id }`
     * - SignData: `{ result: { signature, address, timestamp, domain, payload }, id }`
     * - Error: `{ error: { code, message }, id }`
     */
    private toWireResponse(eventId: string, result: IntentResponseResult): Record<string, unknown> {
        if (result.type === 'error') {
            return {
                error: { code: result.value.error.code, message: result.value.error.message },
                id: eventId,
            };
        }

        if (result.type === 'transaction') {
            return { result: result.value.boc, id: eventId };
        }

        return {
            result: {
                signature: result.value.signature,
                address: result.value.address,
                timestamp: result.value.timestamp,
                domain: result.value.domain,
                payload: this.signDataPayloadToWire(result.value.payload),
            },
            id: eventId,
        };
    }

    /**
     * Convert SignDataPayload model back to wire format.
     */
    private signDataPayloadToWire(payload: SignDataPayload): Record<string, unknown> {
        const { data } = payload;
        switch (data.type) {
            case 'text':
                return { type: 'text', text: data.value.content };
            case 'binary':
                return { type: 'binary', bytes: data.value.content };
            case 'cell':
                return { type: 'cell', cell: data.value.content, schema: data.value.schema };
        }
    }

    // -- Private: Helpers -----------------------------------------------------

    private getWallet(walletId: string): Wallet {
        const wallet = this.walletManager.getWallet(walletId);
        if (!wallet) {
            throw new WalletKitError(
                ERROR_CODES.WALLET_NOT_FOUND,
                'Wallet not found for intent processing',
                undefined,
                { walletId },
            );
        }
        return wallet;
    }

    private emit(event: IntentRequestEvent | BatchedIntentEvent): void {
        for (const callback of this.callbacks) {
            try {
                callback(event);
            } catch (error) {
                log.error('Intent callback error', { error });
            }
        }
    }
}
