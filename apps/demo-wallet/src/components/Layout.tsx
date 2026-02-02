/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';

import { SettingsDropdown } from './SettingsDropdown';

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
    showLogout?: boolean;
    headerAction?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, title = 'TON Wallet', showLogout = false, headerAction }) => {
    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="sm:w-md md:w-lg mx-auto px-4 py-2 flex justify-between items-center">
                    <h1 className="text-lg font-bold text-gray-900" data-testid="title">
                        {title}
                    </h1>
                    <div className="flex items-center gap-2">
                        {headerAction}
                        {showLogout && <SettingsDropdown />}
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto px-3 py-4">{children}</main>
        </div>
    );
};
