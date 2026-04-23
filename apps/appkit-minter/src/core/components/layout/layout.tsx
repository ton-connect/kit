/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type React from 'react';
import { Button, TonConnectButton } from '@ton/appkit-react';
import { Menu } from 'lucide-react';

import { AppLogo } from '../app-logo';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '../sheet';
import { SidePanelContent } from './side-panel-content';
import { ThemeSwitcher } from './theme-switcher';

interface LayoutProps {
    children: React.ReactNode;
}

const AppBrand: React.FC = () => (
    <div className="flex items-center gap-2">
        <AppLogo className="size-8" />
        <span className="text-base font-bold text-foreground">NFT Minter</span>
    </div>
);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex min-h-svh w-full">
            <aside className="sticky top-0 hidden h-svh w-[280px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-tertiary p-4 md:flex">
                <AppBrand />
                <SidePanelContent />
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-tertiary bg-background/80 px-4 backdrop-blur">
                    <AppLogo className="size-8 md:hidden" />

                    <TonConnectButton className="ml-auto" />
                    <ThemeSwitcher />

                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button
                                type="button"
                                size="icon"
                                aria-label="Open menu"
                                variant="ghost"
                                className="block md:!hidden"
                            >
                                <Menu className="size-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            className="flex w-[18rem] max-w-[85vw] flex-col gap-4 overflow-y-auto p-4 sm:max-w-[18rem]"
                        >
                            <SheetTitle className="sr-only">Navigation</SheetTitle>
                            <SidePanelContent onNavigate={() => setMobileOpen(false)} />
                        </SheetContent>
                    </Sheet>
                </header>

                <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>

                <footer className="py-2 text-center text-xs text-tertiary-foreground">
                    <p>Powered by AppKit & TonConnect</p>
                </footer>
            </div>
        </div>
    );
};
