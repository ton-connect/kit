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
    IntentTransactionResponseSuccess,
    IntentSignDataResponseSuccess,
    IntentResponseError,
    IntentResponse,
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
import { kitCall, getKit, getWallet } from '../utils/bridge';

/**
 * Check if a URL is an intent URL (tc://intent_inline?... or tc://intent?...)
 */
export const isIntentUrl = (args: IsIntentUrlArgs): Promise<boolean> => kitCall('isIntentUrl', args);

/**
 * Handle an intent URL
 * Parses the URL and emits an intent event for the wallet UI
 */
export const handleIntentUrl = (args: HandleIntentUrlArgs): Promise<void> => kitCall('handleIntentUrl', args);

/**
 * Convert intent items to a transaction request
 * Used when approving an intent to build the actual transaction
 */
export async function intentItemsToTransactionRequest(
    args: IntentItemsToTransactionRequestArgs,
): Promise<TransactionRequest> {
    const kit = await getKit();
    const wallet = await getWallet(args.walletId);
    return await kit.intentItemsToTransactionRequest(args.event, wallet);
}

/**
 * Approve a transaction intent (txIntent or signMsg)
 */
export const approveTransactionIntent = (
    args: ApproveTransactionIntentArgs,
): Promise<IntentTransactionResponseSuccess> => kitCall('approveTransactionIntent', args);

/**
 * Approve a sign data intent (signIntent)
 */
export const approveSignDataIntent = (args: ApproveSignDataIntentArgs): Promise<IntentSignDataResponseSuccess> =>
    kitCall('approveSignDataIntent', args);

/**
 * Reject an intent request
 */
export async function rejectIntent(args: RejectIntentArgs): Promise<IntentResponseError> {
    const kit = await getKit();

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
    return await kit.rejectIntent(args.event, args.reason, args.errorCode);
}

/**
 * Approve an action intent (actionIntent)
 */
export const approveActionIntent = (args: ApproveActionIntentArgs): Promise<IntentResponse> =>
    kitCall('approveActionIntent', args);

/**
 * Process connect request after intent approval
 */
export const processConnectAfterIntent = (args: ProcessConnectAfterIntentArgs): Promise<void> =>
    kitCall('processConnectAfterIntent', args);
