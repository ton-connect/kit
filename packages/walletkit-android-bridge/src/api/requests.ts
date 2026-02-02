/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * requests.ts – Request approval handlers
 *
 * Bridge for connect, transaction, and sign-data request approvals/rejections.
 *
 * The Android SDK sends the full event object along with the response when approving requests.
 * The event is stored in args.event and passed directly to TonWalletKit.
 */

import type {
    ApproveConnectRequestArgs,
    RejectConnectRequestArgs,
    ApproveTransactionRequestArgs,
    RejectTransactionRequestArgs,
    ApproveSignDataRequestArgs,
    RejectSignDataRequestArgs,
} from '../types';
import { callBridge } from '../utils/bridgeWrapper';
import { log } from '../utils/logger';

/**
 * Approves a connect request.
 */
export async function approveConnectRequest(args: ApproveConnectRequestArgs) {
    return callBridge('approveConnectRequest', async (kit) => {
        log('approveConnectRequest walletId:', args.walletId);

        const event = args.event as { walletId?: string; id?: string };
        if (!event) {
            throw new Error('Event is required for connect request approval');
        }

        // Set walletId on the event (wallet lookup not needed - wallet is managed by Kotlin)
        event.walletId = args.walletId;

        // Pass event and response as separate parameters (new API)
        const result = await kit.approveConnectRequest(event, args.response);

        return result;
    });
}

/**
 * Rejects a connect request.
 */
export async function rejectConnectRequest(args: RejectConnectRequestArgs) {
    return callBridge('rejectConnectRequest', async (kit) => {
        const event = args.event as { id?: string };
        if (!event) {
            throw new Error('Event is required for connect request rejection');
        }

        const result = await kit.rejectConnectRequest(event, args.reason, args.errorCode);

        return result ?? { success: true };
    });
}

/**
 * Approves a transaction request.
 */
export async function approveTransactionRequest(args: ApproveTransactionRequestArgs) {
    return callBridge('approveTransactionRequest', async (kit) => {
        const event = args.event as { walletId?: string; id?: string };
        if (!event) {
            throw new Error('Event is required for transaction request approval');
        }

        // Set walletId on the event
        if (args.walletId) {
            event.walletId = args.walletId;
        }

        // Pass event and response as separate parameters (new API)
        const result = await kit.approveTransactionRequest(event, args.response);

        return result;
    });
}

/**
 * Rejects a transaction request.
 */
export async function rejectTransactionRequest(args: RejectTransactionRequestArgs) {
    return callBridge('rejectTransactionRequest', async (kit) => {
        const event = args.event as { id?: string };
        if (!event) {
            throw new Error('Event is required for transaction request rejection');
        }

        // If errorCode is provided, pass it as an error object; otherwise just pass the reason string
        const reason =
            args.errorCode !== undefined
                ? { code: args.errorCode, message: args.reason || 'Transaction rejected' }
                : args.reason;

        const result = await kit.rejectTransactionRequest(event, reason);

        return result ?? { success: true };
    });
}

/**
 * Approves a sign-data request.
 */
export async function approveSignDataRequest(args: ApproveSignDataRequestArgs) {
    return callBridge('approveSignDataRequest', async (kit) => {
        log('approveSignDataRequest args:', args);

        const event = args.event as { walletId?: string; id?: string };
        if (!event) {
            throw new Error('Event is required for sign-data request approval');
        }

        log('approveSignDataRequest event:', event);

        // Set walletId on the event
        if (args.walletId) {
            event.walletId = args.walletId;
        }

        // Pass event and response as separate parameters (new API)
        log('approveSignDataRequest calling kit.approveSignDataRequest with event:', event, 'response:', args.response);
        const result = await kit.approveSignDataRequest(event, args.response);
        log('approveSignDataRequest result:', result);

        return result;
    });
}

/**
 * Rejects a sign-data request.
 */
export async function rejectSignDataRequest(args: RejectSignDataRequestArgs) {
    return callBridge('rejectSignDataRequest', async (kit) => {
        const event = args.event as { id?: string };
        if (!event) {
            throw new Error('Event is required for sign-data request rejection');
        }

        // If errorCode is provided, pass it as an error object; otherwise just pass the reason string
        const reason =
            args.errorCode !== undefined
                ? { code: args.errorCode, message: args.reason || 'Sign data rejected' }
                : args.reason;

        const result = await kit.rejectSignDataRequest(event, reason);

        return result ?? { success: true };
    });
}
