/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * intents.ts – Intent URL handling operations
 *
 * Handles TonConnect intent deep links (tc://intent_inline?...) that allow
 * dApps to request actions without a prior TonConnect session.
 */

import type {
    TransactionRequest,
    IntentItem,
    TransactionIntentEvent,
    SignDataIntentEvent,
    ActionIntentEvent,
    IntentEvent,
    IntentTransactionResponseSuccess,
    IntentSignDataResponseSuccess,
    IntentResponseError,
    IntentResponse,
    SignDataIntentPayload,
    Wallet,
} from '@ton/walletkit';

import type {
    HandleIntentUrlArgs,
    IsIntentUrlArgs,
    IntentItemsToTransactionRequestArgs,
    ApproveTransactionIntentArgs,
    ApproveSignDataIntentArgs,
    ApproveActionIntentArgs,
    ProcessConnectAfterIntentArgs,
    RejectIntentArgs,
} from '../types';
import type { WalletKitInstance } from '../types/walletkit';
import { callBridge, callOnWalletBridge } from '../utils/bridgeWrapper';

/**
 * Check if a URL is an intent URL (tc://intent_inline?... or tc://intent?...)
 */
export async function isIntentUrl(args: IsIntentUrlArgs): Promise<boolean> {
    return callBridge('isIntentUrl', async (kit) => {
        return kit.isIntentUrl(args.url);
    });
}

/**
 * Handle an intent URL
 * Parses the URL and emits an intent event for the wallet UI
 */
export async function handleIntentUrl(args: HandleIntentUrlArgs): Promise<void> {
    return callBridge('handleIntentUrl', async (kit) => {
        return await kit.handleIntentUrl(args.url);
    });
}

/**
 * Convert intent items to a transaction request
 * Used when approving an intent to build the actual transaction
 */
export async function intentItemsToTransactionRequest(
    args: IntentItemsToTransactionRequestArgs,
): Promise<TransactionRequest> {
    return callOnWalletBridge<TransactionRequest>(
        args.walletId,
        'intentItemsToTransactionRequest',
        async (kit: WalletKitInstance, wallet: Wallet) => {
            // Convert the simplified event structure to TransactionIntentEvent
            const event: TransactionIntentEvent = {
                id: args.event.id,
                type: args.event.type,
                clientId: '', // Not needed for conversion
                hasConnectRequest: false,
                network: args.event.network,
                validUntil: args.event.validUntil,
                items: args.event.items as IntentItem[],
            };

            return await kit.intentItemsToTransactionRequest(event, wallet);
        },
    );
}

/**
 * Approve a transaction intent (txIntent or signMsg)
 *
 * For txIntent: Signs and sends the transaction to the blockchain
 * For signMsg: Signs but does NOT send (for gasless transactions)
 */
export async function approveTransactionIntent(
    args: ApproveTransactionIntentArgs,
): Promise<IntentTransactionResponseSuccess> {
    return callBridge('approveTransactionIntent', async (kit) => {
        // Convert the simplified event structure to TransactionIntentEvent
        const event: TransactionIntentEvent = {
            id: args.event.id,
            clientId: args.event.clientId,
            hasConnectRequest: args.event.hasConnectRequest,
            type: args.event.type,
            network: args.event.network,
            validUntil: args.event.validUntil,
            items: args.event.items as IntentItem[],
        };

        if (!kit.approveTransactionIntent) {
            throw new Error('approveTransactionIntent not available');
        }
        return await kit.approveTransactionIntent(event, args.walletId);
    });
}

/**
 * Approve a sign data intent (signIntent)
 */
export async function approveSignDataIntent(
    args: ApproveSignDataIntentArgs,
): Promise<IntentSignDataResponseSuccess> {
    return callBridge('approveSignDataIntent', async (kit) => {
        // Convert payload format
        const payload: SignDataIntentPayload = (() => {
            switch (args.event.payload.type) {
                case 'text':
                    return { type: 'text' as const, text: args.event.payload.text! };
                case 'binary':
                    return { type: 'binary' as const, bytes: args.event.payload.bytes! };
                case 'cell':
                    return { type: 'cell' as const, schema: args.event.payload.schema!, cell: args.event.payload.cell! };
                default:
                    throw new Error(`Unknown payload type: ${args.event.payload.type}`);
            }
        })();

        const event: SignDataIntentEvent = {
            id: args.event.id,
            clientId: args.event.clientId,
            hasConnectRequest: args.event.hasConnectRequest,
            type: 'signIntent',
            network: args.event.network,
            manifestUrl: args.event.manifestUrl,
            payload,
        };

        if (!kit.approveSignDataIntent) {
            throw new Error('approveSignDataIntent not available');
        }
        return await kit.approveSignDataIntent(event, args.walletId);
    });
}

/**
 * Reject an intent request
 */
export function rejectIntent(args: RejectIntentArgs): IntentResponseError {
    // Note: rejectIntent is synchronous - it just builds the response object
    // The actual response sending is done by the wallet via another mechanism
    return {
        error: {
            code: args.errorCode ?? 300, // USER_DECLINED
            message: args.reason ?? 'User declined the request',
        },
        id: args.event.id,
    };
}

/**
 * Approve an action intent (actionIntent)
 *
 * Fetches action details from the action URL and executes the action.
 */
export async function approveActionIntent(
    args: ApproveActionIntentArgs,
): Promise<IntentResponse> {
    return callBridge('approveActionIntent', async (kit) => {
        const event: ActionIntentEvent = {
            id: args.event.id,
            clientId: args.event.clientId,
            hasConnectRequest: args.event.hasConnectRequest,
            type: 'actionIntent',
            network: args.event.network,
            actionUrl: args.event.actionUrl,
            manifestUrl: args.event.manifestUrl,
        };

        if (!kit.approveActionIntent) {
            throw new Error('approveActionIntent not available');
        }
        return await kit.approveActionIntent(event, args.walletId);
    });
}

/**
 * Process connect request after intent approval
 *
 * Creates a proper session for the dApp after intent approval.
 */
export async function processConnectAfterIntent(
    args: ProcessConnectAfterIntentArgs,
): Promise<void> {
    return callBridge('processConnectAfterIntent', async (kit) => {
        // Build the IntentEvent from args
        const event: IntentEvent = {
            id: args.event.id,
            clientId: args.event.clientId,
            hasConnectRequest: args.event.hasConnectRequest,
            type: args.event.type,
            connectRequest: args.event.connectRequest ? {
                manifestUrl: args.event.connectRequest.manifestUrl,
                items: args.event.connectRequest.items?.map(item => ({
                    name: item.name as 'ton_addr' | 'ton_proof',
                    payload: item.payload,
                })),
            } : undefined,
        };

        if (!kit.processConnectAfterIntent) {
            throw new Error('processConnectAfterIntent not available');
        }
        return await kit.processConnectAfterIntent(event, args.walletId, args.proof);
    });
}
