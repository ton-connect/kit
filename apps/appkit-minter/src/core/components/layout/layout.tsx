/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { TonConnectButton } from '@ton/appkit-react';
import { Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ThemeSwitcher } from './theme-switcher';

import { NetworkPicker } from '@/features/network';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-background">
            <header className="bg-card shadow-sm border-b border-border sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity">
                            <Layers className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-foreground">NFT Minter</h1>
                    </Link>

                    <div className="ml-auto flex items-center gap-2">
                        <NetworkPicker />
                        <TonConnectButton />
                        <ThemeSwitcher />
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-4">{children}</main>

            <footer className="text-center py-2 text-xs text-muted-foreground">
                <p>Powered by AppKit & TonConnect</p>
            </footer>
        </div>
    );
};
