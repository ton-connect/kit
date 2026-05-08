/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { useEffect, useState } from 'react';

interface QuoteTimerProps {
    expiresAt?: number; // Unix timestamp in seconds
    isRefreshing?: boolean;
}

/**
 * Slim, inline indicator that lives inside the quote details block.
 * The quote refreshes itself silently before expiry, so this is a passive
 * status line — not an interactive banner.
 */
export const QuoteTimer: FC<QuoteTimerProps> = ({ expiresAt, isRefreshing = false }) => {
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        if (!expiresAt) {
            setSecondsLeft(0);
            return;
        }

        const update = () => {
            const now = Math.floor(Date.now() / 1000);
            setSecondsLeft(Math.max(0, expiresAt - now));
        };

        update();
        const interval = setInterval(update, 500);
        return () => clearInterval(interval);
    }, [expiresAt]);

    if (isRefreshing || secondsLeft === 0) {
        return (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                Refreshing quote…
            </span>
        );
    }

    return (
        <span className="text-muted-foreground text-xs">
            Refreshes in <span className="font-medium text-foreground">{secondsLeft}s</span>
        </span>
    );
};
