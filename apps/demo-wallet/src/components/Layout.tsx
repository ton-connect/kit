/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';

import { SettingsDropdown } from './SettingsDropdown';
import { StreamingStatus } from './StreamingStatus';

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
    showLogout?: boolean;
    headerAction?: React.ReactNode;
    onBack?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    title = 'TON Wallet',
    showLogout = false,
    headerAction,
    onBack,
}) => {
    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="sm:w-md md:w-lg mx-auto px-4 py-2 flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-1 -ml-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                            aria-label="Back"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                    )}
                    <h1 className="flex-1 text-lg font-bold text-gray-900 min-w-0 truncate" data-testid="title">
                        {title}
                    </h1>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {headerAction}
                        {showLogout && (
                            <>
                                <StreamingStatus />
                                <SettingsDropdown />
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto px-3 py-4">{children}</main>
        </div>
    );
};
