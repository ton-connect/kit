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
import { IntentParser, INTENT_ERROR_CODES, isIntentUrl } from './IntentParser';
import { IntentResolver } from './IntentResolver';
import { ConnectHandler } from './ConnectHandler';
import type { BridgeManager } from '../core/BridgeManager';
import type { WalletManager } from '../core/WalletManager';
import type { Wallet } from '../api/interfaces';
import type { RawBridgeEvent, RawBridgeEventConnect } from '../types/internal';
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
    BridgeEvent,
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
        return isIntentUrl(url);
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

        // Resolve connect request into a ConnectIntentRequestEvent if present
        let connectItem: IntentRequestEvent | undefined;
        if (connectRequest) {
            const connectionEvent = await this.resolveConnectRequest(connectRequest, event);
            connectItem = { ...connectionEvent, type: 'connect' as const };
        }

        if (event.type === 'transaction') {
            if (connectItem || event.items.length > 1) {
                // Batch when there's a connect or multiple tx items
                await this.resolveAndEmitBatchedTransaction(event, walletId, connectItem);
            } else {
                await this.resolveAndEmitTransaction(event, walletId);
            }
        } else {
            if (connectItem) {
                // Batch: connect + single non-tx intent
                const batch: BatchedIntentEvent = {
                    type: 'batched',
                    id: event.id,
                    origin: event.origin,
                    clientId: event.clientId,
                    traceId: event.traceId,
                    returnStrategy: event.returnStrategy,
                    intents: [connectItem, event],
                };
                this.emit(batch);
            } else {
                this.emit(event);
            }
        }
    }

    /**
     * Parse and emit a draft intent event received via the existing bridge session.
     * Called when txDraft/signMsgDraft/actionDraft arrives while already connected.
     */
    async handleBridgeDraftEvent(rawEvent: RawBridgeEvent, walletId: string): Promise<void> {
        try {
            const event = this.parser.parseBridgeDraftPayload(rawEvent);

            if (event.type === 'connect') return;

            if (event.type === 'transaction') {
                await this.resolveAndEmitTransaction(event, walletId);
            } else {
                this.emit(event);
            }
        } catch (error) {
            log.error('Failed to handle bridge draft event', { error, eventId: rawEvent.id });
        }
    }

    // -- Public: Callbacks ----------------------------------------------------

    onIntentRequest(callback: IntentCallback): void {
        if (!this.callbacks.includes(callback)) {
            this.callbacks.push(callback);
        }
    }

    removeIntentRequestCallback(callback: IntentCallback): void {
        this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    }

    // -- Public: Approval -----------------------------------------------------

    async approveTransactionDraft(
        event: TransactionIntentRequestEvent,
        walletId: string,
    ): Promise<IntentTransactionResponse> {
        const wallet = this.getWallet(walletId);
        const result = await this.signAndSendTransaction(event, wallet);
        await this.sendResponse(event, result);
        return result;
    }

    /**
     * Approve a batched intent event.
     *
     * Finds the first actionable intent (transaction > signData > action),
     * delegates to the corresponding single-item approval method, and
     * sends one response back using the batch's identity.
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
                allItems.push(...intent.items);
                if (intent.deliveryMode === 'signOnly') {
                    deliveryMode = 'signOnly';
                }
            }
        }

        if (allItems.length > 0) {
            const firstTx = batch.intents.find((i) => i.type === 'transaction');
            const combinedEvent: TransactionIntentRequestEvent = {
                type: 'transaction',
                id: batch.id,
                origin: batch.origin,
                clientId: batch.clientId,
                deliveryMode,
                network: firstTx?.type === 'transaction' ? firstTx.network : undefined,
                validUntil: firstTx?.type === 'transaction' ? firstTx.validUntil : undefined,
                items: allItems,
            };
            const result = await this.signAndSendTransaction(combinedEvent, wallet);
            await this.sendBatchResponse(batch, result, deliveryMode);
            return result;
        }

        const signDataIntent = batch.intents.find((i) => i.type === 'signData');
        if (signDataIntent?.type === 'signData') {
            const result = await this.signSignData(signDataIntent, wallet);
            await this.sendBatchResponse(batch, result);
            return result;
        }

        const actionIntent = batch.intents.find((i) => i.type === 'action');
        if (actionIntent?.type === 'action') {
            const { result, resolvedEvent } = await this.resolveAndApproveAction(actionIntent, wallet);
            const actionDeliveryMode =
                resolvedEvent.type === 'transaction' ? resolvedEvent.deliveryMode : undefined;
            await this.sendBatchResponse(batch, result, actionDeliveryMode);
            return result;
        }

        throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Batched intent contains no actionable items');
    }

    async approveSignDataIntent(event: SignDataIntentRequestEvent, walletId: string): Promise<IntentSignDataResponse> {
        const wallet = this.getWallet(walletId);
        const result = await this.signSignData(event, wallet);
        await this.sendResponse(event, result);
        return result;
    }

    async approveActionDraft(
        event: ActionIntentRequestEvent,
        walletId: string,
    ): Promise<IntentTransactionResponse | IntentSignDataResponse> {
        const wallet = this.getWallet(walletId);
        const { result, resolvedEvent } = await this.resolveAndApproveAction(event, wallet);
        await this.sendResponse(resolvedEvent, result);
        return result;
    }

    // -- Public: Rejection ----------------------------------------------------

    async rejectIntent(
        event: IntentRequestEvent | BatchedIntentEvent,
        reason?: string,
        errorCode?: number,
    ): Promise<IntentErrorResponse> {
        const result: IntentErrorResponse = {
            type: 'error',
            error: {
                code: errorCode ?? INTENT_ERROR_CODES.USER_DECLINED,
                message: reason || 'User declined the request',
            },
        };

        const isBatched = 'intents' in event;
        if (isBatched) {
            await this.sendBatchResponse(event, result);
        } else if (event.type !== 'connect') {
            await this.sendResponse(event, result);
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
        const wallet = this.getWallet(walletId);

        const transactionRequest = await this.resolveTransaction(event, wallet);
        event.resolvedTransaction = transactionRequest;

        try {
            const preview = await wallet.getTransactionPreview(transactionRequest);
            event.preview = preview;
        } catch (error) {
            log.warn('Failed to emulate transaction preview', { error });
            event.preview = undefined;
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
            from: event.clientId || '',
            id: event.id,
            method: 'connect',
            params: {
                manifest: { url: connectRequest.manifestUrl },
                items: connectRequest.items,
            },
            timestamp: Date.now(),
            domain: '',
        };

        const connectHandler = new ConnectHandler(() => {}, this.walletKitOptions, this.analyticsManager);
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
        const wallet = this.getWallet(walletId);

        const itemEvents: TransactionIntentRequestEvent[] = event.items.map((item, i) => ({
            type: 'transaction',
            id: `${event.id}_${i}`,
            origin: event.origin,
            clientId: event.clientId,
            traceId: event.traceId,
            returnStrategy: event.returnStrategy,
            deliveryMode: event.deliveryMode,
            network: event.network,
            validUntil: event.validUntil,
            items: [item],
        }));

        await Promise.all(
            itemEvents.map(async (itemEvent, i) => {
                try {
                    const resolved = await this.resolveTransaction(itemEvent, wallet);
                    itemEvent.resolvedTransaction = resolved;
                    const preview = await wallet.getTransactionPreview(resolved);
                    itemEvent.preview = preview;
                } catch (error) {
                    log.warn('Failed to resolve/emulate batched item', { error, index: i });
                }
            }),
        );

        const perItemEvents: IntentRequestEvent[] = itemEvents;

        const intents: IntentRequestEvent[] = [];
        if (connectItem) intents.push(connectItem);
        intents.push(...perItemEvents);

        const batch: BatchedIntentEvent = {
            type: 'batched',
            id: event.id,
            origin: event.origin,
            clientId: event.clientId,
            traceId: event.traceId,
            returnStrategy: event.returnStrategy,
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

    private async signAndSendTransaction(
        event: TransactionIntentRequestEvent,
        wallet: Wallet,
    ): Promise<IntentTransactionResponse> {
        const transactionRequest = event.resolvedTransaction ?? (await this.resolveTransaction(event, wallet));
        const signedBoc = await wallet.getSignedSendTransaction(transactionRequest, {
            internal: event.deliveryMode === 'signOnly',
        });

        if (event.deliveryMode === 'send' && !this.walletKitOptions.dev?.disableNetworkSend) {
            await CallForSuccess(
                () => wallet.getClient().sendBoc(signedBoc),
                20,
                100,
                (error) => {
                    // Do not retry on HTTP 4xx/5xx — those are definitive rejections
                    if (error instanceof Error && /HTTP [45]\d\d/.test(error.message)) return false;
                    return true;
                },
            );
        }

        return { type: 'transaction', boc: signedBoc as Base64String };
    }

    private async signSignData(event: SignDataIntentRequestEvent, wallet: Wallet): Promise<IntentSignDataResponse> {
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
        return {
            type: 'signData',
            signature: HexToBase64(signature) as Base64String,
            address: wallet.getAddress() as UserFriendlyAddress,
            timestamp: signData.timestamp,
            domain: signData.domain,
            payload: event.payload,
        };
    }

    private async resolveAndApproveAction(
        event: ActionIntentRequestEvent,
        wallet: Wallet,
    ): Promise<{
        result: IntentTransactionResponse | IntentSignDataResponse;
        resolvedEvent: Extract<IntentRequestEvent, { type: 'transaction' }> | Extract<IntentRequestEvent, { type: 'signData' }>;
    }> {
        const actionResponse = await this.resolver.fetchActionUrl(event.actionUrl, wallet.getAddress());
        const resolvedEvent = this.parser.parseActionResponse(actionResponse, event);

        if (resolvedEvent.type === 'transaction') {
            if (resolvedEvent.resolvedTransaction) {
                resolvedEvent.resolvedTransaction.fromAddress = wallet.getAddress();
            }
            const result = await this.signAndSendTransaction(resolvedEvent, wallet);
            return { result, resolvedEvent };
        }
        if (resolvedEvent.type === 'signData') {
            const result = await this.signSignData(resolvedEvent, wallet);
            return { result, resolvedEvent };
        }

        throw new WalletKitError(
            ERROR_CODES.VALIDATION_ERROR,
            `Action URL resolved to unsupported type: ${resolvedEvent.type}`,
        );
    }

    // -- Private: Response sending --------------------------------------------

    private async sendResponse(event: IntentRequestBase, result: IntentResponseResult): Promise<void> {
        if (!event.clientId) {
            log.debug('No clientId on intent event, skipping response send');
            return;
        }

        const wireResponse = this.toWireResponse(event.id, result, event);

        // For intents delivered via an existing bridge session, respond using the
        // existing session crypto (sendResponse) so the SDK's pendingRequests resolves.
        if (event.origin === 'connectedBridge') {
            await this.bridgeManager.sendResponse(event as BridgeEvent, wireResponse);
        } else {
            await this.bridgeManager.sendIntentResponse(event.clientId, wireResponse, event.traceId);
        }
    }

    private async sendBatchResponse(
        batch: BatchedIntentEvent,
        result: IntentResponseResult,
        deliveryMode?: 'send' | 'signOnly',
    ): Promise<void> {
        if (!batch.clientId) {
            log.debug('No clientId on batched intent, skipping response send');
            return;
        }

        const wireResponse = this.toWireResponse(batch.id, result, undefined, deliveryMode);

        try {
            await this.bridgeManager.sendIntentResponse(batch.clientId, wireResponse, batch.traceId);
        } catch (error) {
            log.error('Failed to send batched intent response', { error, batchId: batch.id });
        }
    }

    /**
     * Convert SDK response model to TonConnect wire format.
     * - Transaction (send): `{ result: "<boc>", id }`
     * - Transaction (signOnly/signMsgDraft): `{ result: { internal_boc: "<boc>" }, id }`
     * - SignData: `{ result: { signature, address, timestamp, domain, payload }, id }`
     * - Error: `{ error: { code, message }, id }`
     */
    private toWireResponse(
        eventId: string,
        result: IntentResponseResult,
        event?: IntentRequestBase,
        deliveryMode?: 'send' | 'signOnly',
    ): Record<string, unknown> {
        if (result.type === 'error') {
            return {
                error: { code: result.error.code, message: result.error.message },
                id: eventId,
            };
        }

        if (result.type === 'transaction') {
            const txEvent = event as Extract<IntentRequestEvent, { type: 'transaction' }> | undefined;
            const isSignOnly = deliveryMode === 'signOnly' || txEvent?.deliveryMode === 'signOnly';
            if (isSignOnly) {
                return { result: { internal_boc: result.boc }, id: eventId };
            }
            return { result: result.boc, id: eventId };
        }

        return {
            result: {
                signature: result.signature,
                address: result.address,
                timestamp: result.timestamp,
                domain: result.domain,
                payload: this.signDataPayloadToWire(result.payload),
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
