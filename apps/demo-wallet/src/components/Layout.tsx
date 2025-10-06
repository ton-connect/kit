import React from 'react';

import { SettingsDropdown } from './SettingsDropdown';
import { useAuth } from '../stores';

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
    showLogout?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, title = 'TON Wallet', showLogout = false }) => {
    const { network } = useAuth();

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="sm:w-md md:w-lg mx-auto px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <h1 className="text-lg font-bold text-gray-900" data-testid="title">
                            {title}
                        </h1>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                        </span>
                    </div>
                    {showLogout && <SettingsDropdown />}
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 py-6">{children}</main>
        </div>
    );
};
