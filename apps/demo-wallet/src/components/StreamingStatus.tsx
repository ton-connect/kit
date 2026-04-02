/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { useWallet } from '@demo/wallet-core';

export const StreamingStatus: React.FC = () => {
    const { isStreamingConnected } = useWallet();

    return (
        <div className="flex items-center gap-1.5 text-xs">
            <div
                className={`h-2 w-2 rounded-full ${isStreamingConnected ? 'bg-green-500' : 'bg-red-500'}`}
                data-testid="streaming-status-dot"
            />
            <span
                className={isStreamingConnected ? 'text-green-600' : 'text-red-600'}
                data-testid="streaming-status-label"
            >
                {isStreamingConnected ? 'Live Updates' : 'Disconnected'}
            </span>
        </div>
    );
};
