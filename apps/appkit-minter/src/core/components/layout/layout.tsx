/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { TonConnectButton } from '@ton/appkit-react';
import { Layers, ArrowLeftRight, Image } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { ThemeSwitcher } from './theme-switcher';

import { NetworkPicker } from '@/features/network';

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title = 'NFT Minter' }) => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-card shadow-sm border-b border-border sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
                        >
                            <Layers className="w-5 h-5 text-white" />
                        </Link>
                        <h1 className="text-xl font-bold text-foreground">{title}</h1>
                    </div>

                    <nav className="flex items-center gap-4 ml-6 mr-auto">
                        <Link
                            to="/"
                            className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                                location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'
                            }`}
                        >
                            <Image className="w-4 h-4" />
                            Minter
                        </Link>
                        <Link
                            to="/swap"
                            className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                                location.pathname === '/swap' ? 'text-primary' : 'text-muted-foreground'
                            }`}
                        >
                            <ArrowLeftRight className="w-4 h-4" />
                            Swap
                        </Link>
                    </nav>

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
