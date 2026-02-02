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

import type { ConnectionRequestEvent, SendTransactionRequestEvent, SignDataRequestEvent } from '@ton/walletkit';

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
 * The event object is passed from Kotlin and contains all required fields.
 */
export async function approveConnectRequest(args: ApproveConnectRequestArgs): Promise<void> {
    return callBridge('approveConnectRequest', async (kit) => {
        log('approveConnectRequest walletId:', args.walletId);

        const event = args.event;
        if (!event) {
            throw new Error('Event is required for connect request approval');
        }

        // Set walletId on the event (wallet lookup not needed - wallet is managed by Kotlin)
        (event as { walletId?: string }).walletId = args.walletId;

        // Cast to the expected type - Kotlin sends the full event with all required fields
        await kit.approveConnectRequest(
            event as unknown as ConnectionRequestEvent,
            args.response as Parameters<typeof kit.approveConnectRequest>[1],
        );
    });
}

/**
 * Rejects a connect request.
 */
export async function rejectConnectRequest(args: RejectConnectRequestArgs): Promise<{ success: boolean }> {
    return callBridge('rejectConnectRequest', async (kit) => {
        const event = args.event;
        if (!event) {
            throw new Error('Event is required for connect request rejection');
        }

        const result = await kit.rejectConnectRequest(
            event as unknown as ConnectionRequestEvent,
            args.reason,
            args.errorCode,
        );

        return result ?? { success: true };
    });
}

/**
 * Approves a transaction request.
 */
export async function approveTransactionRequest(args: ApproveTransactionRequestArgs): Promise<{ signedBoc: string }> {
    return callBridge('approveTransactionRequest', async (kit) => {
        const event = args.event;
        if (!event) {
            throw new Error('Event is required for transaction request approval');
        }

        // Set walletId on the event
        if (args.walletId) {
            (event as { walletId?: string }).walletId = args.walletId;
        }

        // Cast to the expected type - Kotlin sends the full event with all required fields
        const result = await kit.approveTransactionRequest(
            event as unknown as SendTransactionRequestEvent,
            args.response as Parameters<typeof kit.approveTransactionRequest>[1],
        );

        return result as { signedBoc: string };
    });
}

/**
 * Rejects a transaction request.
 */
export async function rejectTransactionRequest(args: RejectTransactionRequestArgs): Promise<{ success: boolean }> {
    return callBridge('rejectTransactionRequest', async (kit) => {
        const event = args.event;
        if (!event) {
            throw new Error('Event is required for transaction request rejection');
        }

        // If errorCode is provided, pass it as an error object; otherwise just pass the reason string
        const reason =
            args.errorCode !== undefined
                ? { code: args.errorCode, message: args.reason || 'Transaction rejected' }
                : args.reason;

        const result = await kit.rejectTransactionRequest(event as unknown as SendTransactionRequestEvent, reason);

        return result ?? { success: true };
    });
}

/**
 * Approves a sign-data request.
 */
export async function approveSignDataRequest(
    args: ApproveSignDataRequestArgs,
): Promise<{ signature: string; timestamp: number }> {
    return callBridge('approveSignDataRequest', async (kit) => {
        log('approveSignDataRequest args:', args);

        const event = args.event;
        if (!event) {
            throw new Error('Event is required for sign-data request approval');
        }

        log('approveSignDataRequest event:', event);

        // Set walletId on the event
        if (args.walletId) {
            (event as { walletId?: string }).walletId = args.walletId;
        }

        // Cast to the expected type - Kotlin sends the full event with all required fields
        log('approveSignDataRequest calling kit.approveSignDataRequest with event:', event, 'response:', args.response);
        const result = await kit.approveSignDataRequest(
            event as unknown as SignDataRequestEvent,
            args.response as Parameters<typeof kit.approveSignDataRequest>[1],
        );
        log('approveSignDataRequest result:', result);

        return result as { signature: string; timestamp: number };
    });
}

/**
 * Rejects a sign-data request.
 */
export async function rejectSignDataRequest(args: RejectSignDataRequestArgs): Promise<{ success: boolean }> {
    return callBridge('rejectSignDataRequest', async (kit) => {
        const event = args.event;
        if (!event) {
            throw new Error('Event is required for sign-data request rejection');
        }

        // If errorCode is provided, pass it as an error object; otherwise just pass the reason string
        const reason =
            args.errorCode !== undefined
                ? { code: args.errorCode, message: args.reason || 'Sign data rejected' }
                : args.reason;

        const result = await kit.rejectSignDataRequest(event as unknown as SignDataRequestEvent, reason);

        return result ?? { success: true };
    });
}
