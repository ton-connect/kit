/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { TonConnectButton } from '@ton/appkit-react';

import { AppSidebar } from './app-sidebar';
import { ThemeSwitcher } from './theme-switcher';

import { Separator } from '@/core/components/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/core/components/sidebar';

interface LayoutProps {
    title?: string;
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ title, children }) => {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-tertiary bg-background/80 px-4 backdrop-blur">
                    <SidebarTrigger />

                    {title && (
                        <>
                            <Separator orientation="vertical" className="!h-6" />
                            <h1 className="text-base font-semibold text-foreground">{title}</h1>
                        </>
                    )}

                    <TonConnectButton className="ml-auto" />
                    <ThemeSwitcher />
                </header>

                <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-4">{children}</main>

                <footer className="text-center py-2 text-xs text-tertiary-foreground">
                    <p>Powered by AppKit & TonConnect</p>
                </footer>
            </SidebarInset>
        </SidebarProvider>
    );
};
