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
    ConnectionApprovalProof,
} from '@ton/walletkit';
import type { ConnectItem } from '@tonconnect/protocol';

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
import { getKit, getWallet } from '../utils/bridge';

/**
 * Check if a URL is an intent URL (tc://intent_inline?... or tc://intent?...)
 */
export async function isIntentUrl(args: IsIntentUrlArgs): Promise<boolean> {
    const kit = await getKit();
    return kit.isIntentUrl(args.url);
}

/**
 * Handle an intent URL
 * Parses the URL and emits an intent event for the wallet UI
 */
export async function handleIntentUrl(args: HandleIntentUrlArgs): Promise<void> {
    const kit = await getKit();
    return await kit.handleIntentUrl(args.url);
}

/**
 * Convert intent items to a transaction request
 * Used when approving an intent to build the actual transaction
 */
export async function intentItemsToTransactionRequest(
    args: IntentItemsToTransactionRequestArgs,
): Promise<TransactionRequest> {
    const kit = await getKit();
    const wallet = await getWallet(args.walletId);

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
    const kit = await getKit();

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
}

/**
 * Approve a sign data intent (signIntent)
 */
export async function approveSignDataIntent(args: ApproveSignDataIntentArgs): Promise<IntentSignDataResponseSuccess> {
    const kit = await getKit();

    // Convert payload format
    const payload: SignDataIntentPayload = (() => {
        switch (args.event.payload.type) {
            case 'text':
                return { type: 'text' as const, text: args.event.payload.text! };
            case 'binary':
                return { type: 'binary' as const, bytes: args.event.payload.bytes! };
            case 'cell':
                return {
                    type: 'cell' as const,
                    schema: args.event.payload.schema!,
                    cell: args.event.payload.cell!,
                };
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
}

/**
 * Reject an intent request
 */
export async function rejectIntent(args: RejectIntentArgs): Promise<IntentResponseError> {
    const kit = await getKit();

    // Only need id and clientId for rejection
    const event = {
        id: args.event.id,
        clientId: args.event.clientId,
    };

    if (!kit.rejectIntent) {
        // Fallback for older kit versions - just build the response locally
        return {
            error: {
                code: args.errorCode ?? 300, // USER_DECLINED
                message: args.reason ?? 'User declined the request',
            },
            id: args.event.id,
        };
    }
    return await kit.rejectIntent(event, args.reason, args.errorCode);
}

/**
 * Approve an action intent (actionIntent)
 *
 * Fetches action details from the action URL and executes the action.
 */
export async function approveActionIntent(args: ApproveActionIntentArgs): Promise<IntentResponse> {
    const kit = await getKit();

    const event: ActionIntentEvent = {
        id: args.event.id,
        clientId: args.event.clientId,
        hasConnectRequest: args.event.hasConnectRequest,
        type: 'actionIntent',
        actionUrl: args.event.actionUrl,
    };

    if (!kit.approveActionIntent) {
        throw new Error('approveActionIntent not available');
    }
    return await kit.approveActionIntent(event, args.walletId);
}

/**
 * Process connect request after intent approval
 *
 * Creates a proper session for the dApp after intent approval.
 */
export async function processConnectAfterIntent(args: ProcessConnectAfterIntentArgs): Promise<void> {
    const kit = await getKit();

    // Build the IntentEvent from args
    // We need to construct a minimal valid IntentEvent - use TransactionIntentEvent as base
    const event: IntentEvent = {
        id: args.event.id,
        clientId: args.event.clientId,
        hasConnectRequest: args.event.hasConnectRequest,
        type: args.event.type as 'txIntent',
        items: [], // Empty items for processConnectAfterIntent
        connectRequest: args.event.connectRequest
            ? {
                  manifestUrl: args.event.connectRequest.manifestUrl,
                  items: (args.event.connectRequest.items ?? []).map((item) => ({
                      name: item.name,
                      payload: item.payload,
                  })) as ConnectItem[],
              }
            : undefined,
    };

    if (!kit.processConnectAfterIntent) {
        throw new Error('processConnectAfterIntent not available');
    }

    // Convert proof to ConnectionApprovalProof type (signature needs to be cast as Base64String)
    const proof = args.proof
        ? {
              signature: args.proof.signature as unknown as ConnectionApprovalProof['signature'],
              timestamp: args.proof.timestamp,
              domain: args.proof.domain,
              payload: args.proof.payload,
          }
        : undefined;

    return await kit.processConnectAfterIntent(event, args.walletId, proof);
}
