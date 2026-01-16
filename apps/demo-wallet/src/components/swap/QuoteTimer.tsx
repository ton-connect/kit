/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { useEffect, useState } from 'react';

import { Button } from '../Button';

interface QuoteTimerProps {
    expiresAt?: number; // Unix timestamp in seconds
    onRefresh: () => void;
    isLoading?: boolean;
}

export const QuoteTimer: FC<QuoteTimerProps> = ({ expiresAt, onRefresh, isLoading = false }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!expiresAt) {
            setTimeLeft(0);
            return;
        }

        const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000); // Current time in seconds
            const remaining = Math.max(0, expiresAt - now);
            setTimeLeft(remaining * 1000); // Convert to milliseconds for display
        };

        updateTimer();
        const interval = setInterval(updateTimer, 100);

        return () => clearInterval(interval);
    }, [expiresAt]);

    const totalSeconds = Math.ceil(timeLeft / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const isExpired = !expiresAt || timeLeft === 0;

    if (isExpired) {
        return (
            <div className="flex items-center justify-between rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2">
                <span className="text-yellow-800 text-sm font-medium">Quote expired</span>
                <Button
                    onClick={onRefresh}
                    disabled={isLoading}
                    isLoading={isLoading}
                    size="sm"
                    className="h-7 px-3 text-xs"
                >
                    Refresh
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
            <span className="text-blue-800 text-sm">
                Quote valid for{' '}
                <span className="font-semibold">
                    {minutes > 0 && `${minutes}m `}
                    {seconds}s
                </span>
            </span>
        </div>
    );
};
