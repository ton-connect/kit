/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

/**
 * Request approval helpers for connect, transaction, and sign-data flows.
 */
import type {
    ApproveConnectRequestArgs,
    RejectConnectRequestArgs,
    ApproveTransactionRequestArgs,
    RejectTransactionRequestArgs,
    ApproveSignDataRequestArgs,
    RejectSignDataRequestArgs,
    CallContext,
} from '../types';
import { ensureWalletKitLoaded } from '../core/moduleLoader';
import { walletKit } from '../core/state';
import { requireWalletKit } from '../core/initialization';
import { emitCallCheckpoint } from '../transport/diagnostics';

/**
 * Approves a connect request, restoring JS bridge metadata when required for in-app flows.
 *
 * @param args - Connect request payload from the native layer.
 * @param context - Diagnostic context for tracing.
 */
export async function approveConnectRequest(args: ApproveConnectRequestArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'approveConnectRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'approveConnectRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    emitCallCheckpoint(context, 'approveConnectRequest:after-requireWalletKit');

    if (typeof walletKit.ensureInitialized === 'function') {
        console.log('ensureInitialized');
        emitCallCheckpoint(context, 'approveConnectRequest:before-walletKit.ensureInitialized');
        await walletKit.ensureInitialized();
        console.log('await this.initializationPromise');
        emitCallCheckpoint(context, 'approveConnectRequest:after-walletKit.ensureInitialized');
        console.log('ensureInitialized done');
    }

    const event = args.event;
    if (!event) {
        throw new Error('Connect request event is required');
    }
    const wallet = walletKit.getWallet?.(args.walletAddress);
    if (!wallet) {
        throw new Error('Wallet not found');
    }
    const resolvedAddress =
        (typeof wallet.getAddress === 'function' ? wallet.getAddress() : wallet.address) || args.walletAddress;
    event.wallet = wallet;
    event.walletAddress = resolvedAddress;

    const hasSessionId = !!(event.request?.from || event.from);
    const manifestUrl = event.preview?.manifest?.url || event.dAppInfo?.url || '';

    const isInternalBrowser =
        !hasSessionId ||
        !manifestUrl ||
        manifestUrl.includes('localhost') ||
        manifestUrl.includes('127.0.0.1') ||
        manifestUrl.includes('appassets.androidplatform.net');

    console.log('[walletkitBridge] 🔍 Event type detection:', {
        hasSessionId,
        manifestUrl,
        from: event.request?.from || event.from,
        isInternalBrowser,
        eventId: event.id,
    });

    if (isInternalBrowser) {
        console.log('[walletkitBridge] 🔧 Restoring missing JS bridge fields for internal browser event');
        event.isJsBridge = true;

        let actualDomain = event.domain || 'internal-browser';

        if (!event.domain) {
            console.log('[walletkitBridge] ⚠️ Domain missing from event, attempting to resolve from window');
            try {
                if (typeof window !== 'undefined') {
                    if (window.top && window.top !== window && window.top.location) {
                        actualDomain = window.top.location.hostname;
                    } else if (document.referrer) {
                        const referrerUrl = new URL(document.referrer);
                        actualDomain = referrerUrl.hostname;
                    } else if (window.location && window.location.hostname !== 'appassets.androidplatform.net') {
                        actualDomain = window.location.hostname;
                    }
                }
            } catch (e) {
                console.log('[walletkitBridge] Could not access parent domain, using fallback:', e);
            }
        } else {
            console.log('[walletkitBridge] ✅ Using domain from event:', event.domain);
        }

        console.log('[walletkitBridge] Resolved domain for connect:', actualDomain);
        event.domain = actualDomain;
        event.tabId = event.id;
        event.messageId = event.id;

        console.log(
            '[walletkitBridge] ✅ Restored fields - isJsBridge:',
            event.isJsBridge,
            'domain:',
            event.domain,
            'tabId:',
            event.tabId,
            'messageId:',
            event.messageId,
        );
    } else {
        console.log('[walletkitBridge] ℹ️ Deep link/QR event - will use HTTP bridge for response');
    }

    emitCallCheckpoint(context, 'approveConnectRequest:before-walletKit.approveConnectRequest');
    const result = await walletKit.approveConnectRequest(event);
    if (result == null) {
        emitCallCheckpoint(context, 'approveConnectRequest:after-walletKit.approveConnectRequest');
        return { success: true } as unknown as Record<string, unknown>;
    }
    if (!result?.success) {
        const message = result?.message || 'Failed to approve connect request';
        throw new Error(message);
    }
    emitCallCheckpoint(context, 'approveConnectRequest:after-walletKit.approveConnectRequest');
    return result;
}

/**
 * Rejects a pending connect request.
 *
 * @param args - Connect request payload and optional reason.
 * @param context - Diagnostic context for tracing.
 */
export async function rejectConnectRequest(args: RejectConnectRequestArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'rejectConnectRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'rejectConnectRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    emitCallCheckpoint(context, 'rejectConnectRequest:after-requireWalletKit');
    const event = args.event;
    if (!event) {
        throw new Error('Connect request event is required');
    }
    const result = await walletKit.rejectConnectRequest(event, args.reason);
    if (result == null) {
        return { success: true };
    }
    if (!result?.success) {
        const message = result?.message || 'Failed to reject connect request';
        throw new Error(message);
    }
    return result;
}

/**
 * Approves a pending transaction request.
 *
 * @param args - Transaction request payload.
 * @param context - Diagnostic context for tracing.
 */
export async function approveTransactionRequest(args: ApproveTransactionRequestArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'approveTransactionRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'approveTransactionRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    const event = args.event;
    if (!event) {
        throw new Error('Transaction request event is required');
    }
    const result = await walletKit.approveTransactionRequest(event);
    return result;
}

/**
 * Rejects a pending transaction request.
 *
 * @param args - Transaction request payload and optional reason.
 * @param context - Diagnostic context for tracing.
 */
export async function rejectTransactionRequest(args: RejectTransactionRequestArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'rejectTransactionRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'rejectTransactionRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    const event = args.event;
    if (!event) {
        throw new Error('Transaction request event is required');
    }
    const result = await walletKit.rejectTransactionRequest(event, args.reason);
    if (result == null) {
        return { success: true };
    }
    if (!result?.success) {
        const message = result?.message || 'Failed to reject transaction request';
        throw new Error(message);
    }
    return result;
}

/**
 * Approves a sign-data request and returns the resulting signature.
 *
 * @param args - Sign-data request payload.
 * @param context - Diagnostic context for tracing.
 */
export async function approveSignDataRequest(args: ApproveSignDataRequestArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'approveSignDataRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'approveSignDataRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    const event = args.event;
    if (!event) {
        throw new Error('Sign data request event is required');
    }
    console.log('[bridge] Approving sign data request with event:', JSON.stringify(event, null, 2));
    const result = await walletKit.signDataRequest(event);
    console.log('[bridge] Sign data result:', JSON.stringify(result, null, 2));
    return result;
}

/**
 * Rejects a pending sign-data request.
 *
 * @param args - Sign-data request payload and optional reason.
 * @param context - Diagnostic context for tracing.
 */
export async function rejectSignDataRequest(args: RejectSignDataRequestArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'rejectSignDataRequest:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'rejectSignDataRequest:after-ensureWalletKitLoaded');
    requireWalletKit();
    const event = args.event;
    if (!event) {
        throw new Error('Sign data request event is required');
    }
    const result = await walletKit.rejectSignDataRequest(event, args.reason);
    if (result == null) {
        return { success: true };
    }
    if (!result?.success) {
        const message = result?.message || 'Failed to reject sign data request';
        throw new Error(message);
    }
    return result;
}
