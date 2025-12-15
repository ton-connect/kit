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
} from '../types';
import { walletKit } from '../core/state';
import { callBridge } from '../utils/bridgeWrapper';
import { log } from '../utils/logger';

/**
 * Approves a connect request.
 */
export async function approveConnectRequest(args: ApproveConnectRequestArgs) {
    return callBridge('approveConnectRequest', async () => {
        if (!args.event) {
            throw new Error('Connect request event is required');
        }

        log('approveConnectRequest walletId:', args.walletId);

        const wallet = walletKit?.getWallet(args.walletId);
        if (!wallet) {
            throw new Error(`Wallet not found for walletId: ${args.walletId}`);
        }

        args.event.wallet = wallet;
        args.event.walletId = args.walletId;

        return await walletKit?.approveConnectRequest(args.event);
    });
}

/**
 * Rejects a connect request.
 */
export async function rejectConnectRequest(args: RejectConnectRequestArgs) {
    return callBridge('rejectConnectRequest', async () => {
        if (!args.event) {
            throw new Error('Connect request event is required');
        }

        const result = await walletKit.rejectConnectRequest(args.event, args.reason, args.errorCode);

        if (result == null) {
            return { success: true };
        }
        if (!result?.success) {
            throw new Error(result?.message || 'Failed to reject connect request');
        }

        return result;
    });
}

/**
 * Approves a transaction request.
 */
export async function approveTransactionRequest(args: ApproveTransactionRequestArgs) {
    return callBridge('approveTransactionRequest', async () => {
        if (!args.event) {
            throw new Error('Transaction request event is required');
        }

        return await walletKit.approveTransactionRequest(args.event);
    });
}

/**
 * Rejects a transaction request.
 */
export async function rejectTransactionRequest(args: RejectTransactionRequestArgs) {
    return callBridge('rejectTransactionRequest', async () => {
        if (!args.event) {
            throw new Error('Transaction request event is required');
        }

        // If errorCode is provided, pass it as an error object; otherwise just pass the reason string
        const reason =
            args.errorCode !== undefined
                ? { code: args.errorCode, message: args.reason || 'Transaction rejected' }
                : args.reason;

        const result = (await walletKit!.rejectTransactionRequest(args.event, reason)) as {
            success?: boolean;
            message?: string;
        } | null;

        if (result == null) {
            return { success: true };
        }
        if (!result?.success) {
            throw new Error(result?.message || 'Failed to reject transaction request');
        }

        return result;
    });
}

/**
 * Approves a sign-data request.
 */
export async function approveSignDataRequest(args: ApproveSignDataRequestArgs) {
    return callBridge('approveSignDataRequest', async () => {
        if (!args.event) {
            throw new Error('Sign data request event is required');
        }

        return await walletKit.signDataRequest(args.event);
    });
}

/**
 * Rejects a sign-data request.
 */
export async function rejectSignDataRequest(args: RejectSignDataRequestArgs) {
    return callBridge('rejectSignDataRequest', async () => {
        if (!args.event) {
            throw new Error('Sign data request event is required');
        }

        const result = await walletKit.rejectSignDataRequest(args.event, args.reason);

        if (result == null) {
            return { success: true };
        }
        if (!result?.success) {
            throw new Error(result?.message || 'Failed to reject sign data request');
        }

        return result;
    });
}
