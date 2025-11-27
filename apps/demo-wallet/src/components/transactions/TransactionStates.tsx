/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';

interface TransactionErrorStateProps {
    error: string;
    onRetry: () => void;
}

/**
 * Error state component for transaction list
 */
export const TransactionErrorState: React.FC<TransactionErrorStateProps> = ({ error, onRetry }) => (
    <div className="text-center py-8">
        <div className="text-red-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        </div>
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={onRetry} className="mt-2 text-blue-500 text-sm hover:text-blue-600">
            Try again
        </button>
    </div>
);

/**
 * Loading state component for transaction list
 */
export const TransactionLoadingState: React.FC = () => (
    <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-gray-500 text-sm">Loading transactions...</p>
    </div>
);

/**
 * Empty state component for transaction list
 */
export const TransactionEmptyState: React.FC = () => (
    <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
            </svg>
        </div>
        <p className="text-gray-500 text-sm">No activity yet</p>
        <p className="text-gray-400 text-xs mt-1">Your history will appear here</p>
    </div>
);
