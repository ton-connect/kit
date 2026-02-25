/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { ConnectRequest } from '@tonconnect/protocol';

import { globalLogger } from '../core/Logger';
import { WalletKitError, ERROR_CODES } from '../errors';
import { CallForSuccess } from '../utils/retry';
import { PrepareSignData } from '../utils/signData/sign';
import { HexToBase64 } from '../utils/base64';
import { IntentParser, INTENT_ERROR_CODES } from './IntentParser';
import { IntentResolver } from './IntentResolver';
import type { BridgeManager } from '../core/BridgeManager';
import type { WalletManager } from '../core/WalletManager';
import type { Wallet } from '../api/interfaces';
import type {
    IntentRequestEvent,
    TransactionIntentRequestEvent,
    SignDataIntentRequestEvent,
    ActionIntentRequestEvent,
    IntentTransactionResponse,
    IntentSignDataResponse,
    IntentErrorResponse,
    IntentResponseResult,
    IntentActionItem,
    BatchedIntentEvent,
    TransactionRequest,
    SignDataPayload,
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
    private pendingConnectRequests = new Map<string, ConnectRequest>();

    constructor(
        private walletKitOptions: TonWalletKitOptions,
        private bridgeManager: BridgeManager,
        private walletManager: WalletManager,
    ) {}

    // -- Public: Parsing ------------------------------------------------------

    isIntentUrl(url: string): boolean {
        return this.parser.isIntentUrl(url);
    }

    /**
     * Parse an intent URL, resolve items, emulate preview, and emit the event.
     */
    async handleIntentUrl(url: string, walletId: string): Promise<void> {
        const { event, connectRequest } = await this.parser.parse(url);

        if (connectRequest) {
            this.pendingConnectRequests.set(event.id, connectRequest);
        }

        if (event.intentType === 'transaction') {
            await this.resolveAndEmitTransaction(event, walletId);
        } else {
            this.emit(event);
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

        const signedBoc = await wallet.getSignedSendTransaction(transactionRequest);

        if (event.deliveryMode === 'send' && !this.walletKitOptions.dev?.disableNetworkSend) {
            await CallForSuccess(() => wallet.getClient().sendBoc(signedBoc));
        }

        const result: IntentTransactionResponse = {
            resultType: 'transaction',
            boc: signedBoc,
        };

        await this.sendResponse(event, result);
        return result;
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
            resultType: 'signData',
            signature: signatureBase64,
            address: Address.parse(wallet.getAddress()).toRawString(),
            timestamp: signData.timestamp,
            domain: signData.domain,
            payload: event.payload,
        };

        await this.sendResponse(event, result);
        return result;
    }

    async approveActionIntent(
        event: ActionIntentRequestEvent,
        walletId: string,
    ): Promise<IntentTransactionResponse | IntentSignDataResponse> {
        const wallet = this.getWallet(walletId);

        const actionResponse = await this.resolver.fetchActionUrl(event.actionUrl, wallet.getAddress());
        const resolvedEvent = this.parser.parseActionResponse(actionResponse, event);

        if (resolvedEvent.intentType === 'transaction') {
            if (resolvedEvent.resolvedTransaction) {
                resolvedEvent.resolvedTransaction.fromAddress = wallet.getAddress();
            }
            return this.approveTransactionIntent(resolvedEvent, walletId);
        } else if (resolvedEvent.intentType === 'signData') {
            return this.approveSignDataIntent(resolvedEvent, walletId);
        }

        throw new WalletKitError(
            ERROR_CODES.VALIDATION_ERROR,
            `Action URL resolved to unsupported intent type: ${resolvedEvent.intentType}`,
        );
    }

    // -- Public: Rejection ----------------------------------------------------

    async rejectIntent(event: IntentRequestEvent, reason?: string, errorCode?: number): Promise<IntentErrorResponse> {
        const result: IntentErrorResponse = {
            resultType: 'error',
            error: {
                code: errorCode ?? INTENT_ERROR_CODES.USER_DECLINED,
                message: reason || 'User declined the request',
            },
        };

        await this.sendResponse(event, result);
        this.pendingConnectRequests.delete(event.id);
        return result;
    }

    // -- Public: Utilities ----------------------------------------------------

    async intentItemsToTransactionRequest(items: IntentActionItem[], walletId: string): Promise<TransactionRequest> {
        const wallet = this.getWallet(walletId);
        return this.resolver.intentItemsToTransactionRequest(items, wallet);
    }

    getPendingConnectRequest(eventId: string): ConnectRequest | undefined {
        return this.pendingConnectRequests.get(eventId);
    }

    removePendingConnectRequest(eventId: string): void {
        this.pendingConnectRequests.delete(eventId);
    }

    // -- Private: Resolution & Emulation --------------------------------------

    private async resolveAndEmitTransaction(event: TransactionIntentRequestEvent, walletId: string): Promise<void> {
        const wallet = this.getWallet(walletId);

        const transactionRequest = await this.resolveTransaction(event, wallet);
        event.resolvedTransaction = transactionRequest;

        try {
            const preview = await wallet.getTransactionPreview(transactionRequest);
            event.preview = { data: preview };
        } catch (error) {
            log.warn('Failed to emulate transaction preview', { error });
            event.preview = { data: undefined };
        }

        this.emit(event);
    }

    private async resolveTransaction(
        event: TransactionIntentRequestEvent,
        wallet: Wallet,
    ): Promise<TransactionRequest> {
        return this.resolver.intentItemsToTransactionRequest(event.items, wallet, event.network, event.validUntil);
    }

    // -- Private: Response sending --------------------------------------------

    private async sendResponse(event: IntentRequestEvent, result: IntentResponseResult): Promise<void> {
        if (!event.clientId) {
            log.debug('No clientId on intent event, skipping response send');
            return;
        }

        const wireResponse = this.toWireResponse(event, result);

        try {
            await this.bridgeManager.sendIntentResponse(event.clientId, wireResponse, event.traceId);
        } catch (error) {
            log.error('Failed to send intent response', { error, eventId: event.id });
        }
    }

    /**
     * Convert SDK response model to TonConnect wire format.
     * - Transaction: `{ result: "<boc>", id }`
     * - SignData: `{ result: { signature, address, timestamp, domain, payload }, id }`
     * - Error: `{ error: { code, message }, id }`
     */
    private toWireResponse(event: IntentRequestEvent, result: IntentResponseResult): Record<string, unknown> {
        if (result.resultType === 'error') {
            return {
                error: { code: result.error.code, message: result.error.message },
                id: event.id,
            };
        }

        if (result.resultType === 'transaction') {
            return { result: result.boc, id: event.id };
        }

        return {
            result: {
                signature: result.signature,
                address: result.address,
                timestamp: result.timestamp,
                domain: result.domain,
                payload: this.signDataPayloadToWire(result.payload),
            },
            id: event.id,
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
