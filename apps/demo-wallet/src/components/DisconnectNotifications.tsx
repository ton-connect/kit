/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { useDisconnectEvents } from '@demo/core';

import { Button } from './Button';

interface DisconnectNotificationsProps {
    className?: string;
}

export const DisconnectNotifications: React.FC<DisconnectNotificationsProps> = ({ className = '' }) => {
    const { disconnectedSessions, clearDisconnectNotifications } = useDisconnectEvents();

    if (!disconnectedSessions || disconnectedSessions.length === 0) {
        return null;
    }

    return (
        <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-yellow-800">Session Disconnected</h3>
                    <div className="mt-2 space-y-2">
                        {disconnectedSessions.map((session) => (
                            <div
                                key={`${session.walletAddress}-${session.timestamp}`}
                                className="text-sm text-yellow-700"
                            >
                                <div className="font-mono text-xs">
                                    {session.walletAddress.slice(0, 8)}...{session.walletAddress.slice(-8)}
                                </div>
                                {session.reason && (
                                    <div className="text-xs text-yellow-600 mt-1">Reason: {session.reason}</div>
                                )}
                                <div className="text-xs text-yellow-500">
                                    {new Date(session.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={clearDisconnectNotifications}
                    className="ml-4 text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                >
                    Dismiss
                </Button>
            </div>
        </div>
    );
};
