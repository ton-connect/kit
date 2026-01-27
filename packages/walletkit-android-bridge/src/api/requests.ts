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
 * Simplified bridge for connect, transaction, and sign-data request approvals/rejections.
 * All event manipulation and metadata restoration handled by Kotlin RequestEventProcessor.
 */

import type {
    ApproveConnectRequestArgs,
    RejectConnectRequestArgs,
    ApproveTransactionRequestArgs,
    RejectTransactionRequestArgs,
    ApproveSignDataRequestArgs,
    RejectSignDataRequestArgs,
    ApproveSignMessageRequestArgs,
    RejectSignMessageRequestArgs,
} from '../types';
import { callBridge } from '../utils/bridgeWrapper';
import { log } from '../utils/logger';

/**
 * Approves a connect request.
 */
export async function approveConnectRequest(args: ApproveConnectRequestArgs) {
    return callBridge('approveConnectRequest', async (kit) => {
        log('approveConnectRequest walletId:', args.walletId);

        const wallet = kit.getWallet(args.walletId);
        args.event.wallet = wallet;
        args.event.walletId = args.walletId;

        return await kit.approveConnectRequest(args.event);
    });
}

/**
 * Rejects a connect request.
 */
export async function rejectConnectRequest(args: RejectConnectRequestArgs) {
    return callBridge('rejectConnectRequest', async (kit) => {
        const result = await kit.rejectConnectRequest(args.event, args.reason, args.errorCode);
        return result ?? { success: true };
    });
}

/**
 * Approves a transaction request.
 */
export async function approveTransactionRequest(args: ApproveTransactionRequestArgs) {
    return callBridge('approveTransactionRequest', async (kit) => {
        // Enrich event with walletId (same pattern as approveConnectRequest)
        if (args.walletId) {
            args.event.walletId = args.walletId;
        }

        return await kit.approveTransactionRequest(args.event);
    });
}

/**
 * Rejects a transaction request.
 */
export async function rejectTransactionRequest(args: RejectTransactionRequestArgs) {
    return callBridge('rejectTransactionRequest', async (kit) => {
        // If errorCode is provided, pass it as an error object; otherwise just pass the reason string
        const reason =
            args.errorCode !== undefined
                ? { code: args.errorCode, message: args.reason || 'Transaction rejected' }
                : args.reason;

        const result = await kit.rejectTransactionRequest(args.event, reason);
        return result ?? { success: true };
    });
}

/**
 * Approves a sign-data request.
 */
export async function approveSignDataRequest(args: ApproveSignDataRequestArgs) {
    return callBridge('approveSignDataRequest', async (kit) => {
        // Enrich event with walletId (same pattern as approveConnectRequest)
        if (args.walletId) {
            args.event.walletId = args.walletId;
        }

        return await kit.approveSignDataRequest(args.event);
    });
}

/**
 * Rejects a sign-data request.
 */
export async function rejectSignDataRequest(args: RejectSignDataRequestArgs) {
    return callBridge('rejectSignDataRequest', async (kit) => {
        // If errorCode is provided, pass it as an error object; otherwise just pass the reason string
        const reason =
            args.errorCode !== undefined
                ? { code: args.errorCode, message: args.reason || 'Sign data rejected' }
                : args.reason;

        const result = await kit.rejectSignDataRequest(args.event, reason);
        return result ?? { success: true };
    });
}

/**
 * Approves a signMessage request (for gasless transactions).
 * Returns a signed internal message BOC that can be sent to a gasless provider.
 */
export async function approveSignMessageRequest(args: ApproveSignMessageRequestArgs) {
    return callBridge('approveSignMessageRequest', async (kit) => {
        // Enrich event with walletId (same pattern as approveTransactionRequest)
        if (args.walletId) {
            args.event.walletId = args.walletId;
        }

        return await kit.approveSignMessageRequest(args.event);
    });
}

/**
 * Rejects a signMessage request.
 */
export async function rejectSignMessageRequest(args: RejectSignMessageRequestArgs) {
    return callBridge('rejectSignMessageRequest', async (kit) => {
        // If errorCode is provided, pass it as an error object; otherwise just pass the reason string
        const reason =
            args.errorCode !== undefined
                ? { code: args.errorCode, message: args.reason || 'SignMessage rejected' }
                : args.reason;

        const result = await kit.rejectSignMessageRequest(args.event, reason);
        return result ?? { success: true };
    });
}
