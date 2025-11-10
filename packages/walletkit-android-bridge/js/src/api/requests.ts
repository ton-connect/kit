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

/**
 * Approves a connect request.
 *
 * Note: The wallet assignment and address resolution (lines 41-42) are necessary
 * SDK operations that must remain in JavaScript. The SDK requires the wallet object
 * to be attached to the event before approval.
 */
export async function approveConnectRequest(args: ApproveConnectRequestArgs) {
    return callBridge('approveConnectRequest', async () => {
        if (!args.event) {
            throw new Error('Connect request event is required');
        }

        const wallet = walletKit.getWallet?.(args.walletAddress);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        args.event.wallet = wallet;
        args.event.walletAddress =
            (typeof wallet.getAddress === 'function' ? wallet.getAddress() : wallet.address) || args.walletAddress;

        const result = await walletKit.approveConnectRequest(args.event);

        if (result == null) {
            return { success: true } as unknown as Record<string, unknown>;
        }
        if (!result?.success) {
            throw new Error(result?.message || 'Failed to approve connect request');
        }

        return result;
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

        const result = await walletKit.rejectConnectRequest(args.event, args.reason);

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

        const result = await walletKit.rejectTransactionRequest(args.event, args.reason);

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
