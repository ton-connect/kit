/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type React from 'react';
import { TonConnectButton } from '@ton/appkit-react';
import { Menu } from 'lucide-react';

import { AppLogo } from '../app-logo';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '../sheet';
import { SidePanelContent } from './side-panel-content';
import { ThemeSwitcher } from './theme-switcher';

interface LayoutProps {
    title?: string;
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ title, children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex min-h-svh w-full flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-tertiary bg-background/80 px-4 backdrop-blur">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <button
                            type="button"
                            aria-label="Open menu"
                            className="flex size-9 items-center justify-center rounded-md text-tertiary-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
                        >
                            <Menu className="size-5" />
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[18rem] max-w-[85vw] overflow-y-auto p-4 sm:max-w-[18rem]">
                        <SheetTitle className="sr-only">Navigation</SheetTitle>
                        <SidePanelContent onNavigate={() => setMobileOpen(false)} />
                    </SheetContent>
                </Sheet>

                <AppLogo className="size-8" />
                <span className="text-base font-bold text-foreground">NFT Minter</span>
                <TonConnectButton className="ml-auto" />
                <ThemeSwitcher />
            </header>

            <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[280px_1fr]">
                <aside className="hidden md:block">
                    <SidePanelContent />
                </aside>

                <main className="min-w-0">
                    {title && <h1 className="mb-4 text-2xl font-semibold text-foreground">{title}</h1>}
                    {children}
                </main>
            </div>

            <footer className="py-2 text-center text-xs text-tertiary-foreground">
                <p>Powered by AppKit & TonConnect</p>
            </footer>
        </div>
    );
};
