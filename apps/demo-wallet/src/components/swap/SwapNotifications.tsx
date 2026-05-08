/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useRef } from 'react';
import { useSwap } from '@demo/wallet-core';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Bridge between the swap slice's background confirmation watcher and the
 * global sonner toaster. Mounted once at the app root so toasts fire on the
 * wallet page (or wherever the user is) after the swap form has navigated away.
 *
 * Uses a notification id from the slice to ensure each swap fires its terminal
 * toast exactly once, regardless of re-renders.
 */
export function SwapNotifications() {
    const { lastSwapNotificationId, lastSwapStatus, lastSwapDurationMs, lastSwapReceipt, lastSwapErrorMessage, lastSwapHash } =
        useSwap();
    const navigate = useNavigate();

    const notifiedTerminalIdRef = useRef<string | null>(null);
    const startedIdRef = useRef<string | null>(null);

    // Fire a transient "broadcasting" toast when a new swap starts so the
    // wallet page has immediate feedback while the watcher is polling.
    useEffect(() => {
        if (!lastSwapNotificationId) return;
        if (startedIdRef.current === lastSwapNotificationId) return;
        if (lastSwapStatus !== 'broadcasting' && lastSwapStatus !== 'confirming') return;

        startedIdRef.current = lastSwapNotificationId;
        toast.loading('Swap broadcasting…', {
            id: `swap-${lastSwapNotificationId}`,
            description: lastSwapReceipt
                ? `${lastSwapReceipt.fromAmount} ${lastSwapReceipt.fromSymbol} → ${lastSwapReceipt.toSymbol}`
                : undefined,
        });
    }, [lastSwapNotificationId, lastSwapStatus, lastSwapReceipt]);

    // Replace the broadcasting toast with the terminal result.
    useEffect(() => {
        if (!lastSwapNotificationId) return;
        if (notifiedTerminalIdRef.current === lastSwapNotificationId) return;

        const toastId = `swap-${lastSwapNotificationId}`;

        if (lastSwapStatus === 'completed') {
            notifiedTerminalIdRef.current = lastSwapNotificationId;
            const duration = lastSwapDurationMs ?? 0;
            const description = lastSwapReceipt
                ? `Sent ${lastSwapReceipt.fromAmount} ${lastSwapReceipt.fromSymbol} · Received ${lastSwapReceipt.toAmount} ${lastSwapReceipt.toSymbol}`
                : undefined;

            toast.success(`Swap confirmed in ${formatDuration(duration)}`, {
                id: toastId,
                description,
                duration: 6000,
                action: lastSwapHash
                    ? {
                          label: 'View',
                          onClick: () => navigate(`/wallet/transactions/${lastSwapHash}`),
                      }
                    : undefined,
            });
            return;
        }

        if (lastSwapStatus === 'failed') {
            notifiedTerminalIdRef.current = lastSwapNotificationId;
            toast.error('Swap failed', {
                id: toastId,
                description: lastSwapErrorMessage ?? 'Something went wrong while broadcasting the swap.',
                duration: 8000,
            });
            return;
        }

        if (lastSwapStatus === 'timeout') {
            notifiedTerminalIdRef.current = lastSwapNotificationId;
            toast('Swap is taking longer than expected', {
                id: toastId,
                description: 'It is still propagating — check Recent Transactions.',
                duration: 8000,
            });
        }
    }, [lastSwapNotificationId, lastSwapStatus, lastSwapDurationMs, lastSwapReceipt, lastSwapErrorMessage, lastSwapHash, navigate]);

    return null;
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 1000)}s`;
}
