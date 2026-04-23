/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { TonConnectButton } from '@ton/appkit-react';
import { ArrowLeftRight, BookOpen, Coins, Github, PenLine, Sparkles } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

import { AppLogo } from '../app-logo';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarSeparator,
    SidebarTrigger,
    useSidebar,
} from '../sidebar';
import { BalanceCard } from './balance-card';
import { ThemeSwitcher } from './theme-switcher';

import { NetworkPicker } from '@/features/network';

interface LayoutProps {
    children: React.ReactNode;
}

const NAV_LINKS: readonly { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { to: '/', label: 'Mint', icon: Sparkles },
    { to: '/swap', label: 'Swap', icon: ArrowLeftRight },
    { to: '/staking', label: 'Staking', icon: Coins },
    { to: '/sign', label: 'Sign Message', icon: PenLine },
];

const EXTERNAL_LINKS: readonly { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { href: 'https://docs.ton.org/ecosystem/appkit/overview', label: 'Docs', icon: BookOpen },
    { href: 'https://github.com/ton-connect/kit', label: 'GitHub', icon: Github },
];

const AppSidebar: React.FC = () => {
    const { setOpenMobile, isMobile } = useSidebar();

    const closeOnMobile = () => {
        if (isMobile) setOpenMobile(false);
    };

    return (
        <Sidebar>
            <SidebarHeader>
                <Link to="/" onClick={closeOnMobile} className="flex items-center gap-2 px-2 py-1.5">
                    <AppLogo className="size-7" />
                    <span className="text-base font-bold text-foreground">NFT Minter</span>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <BalanceCard />
                </SidebarGroup>

                <SidebarSeparator />

                <SidebarGroup>
                    <SidebarMenu>
                        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                            <SidebarMenuItem key={to}>
                                <NavLink to={to} end={to === '/'} onClick={closeOnMobile}>
                                    {({ isActive }) => (
                                        <SidebarMenuButton isActive={isActive}>
                                            <Icon />
                                            <span>{label}</span>
                                        </SidebarMenuButton>
                                    )}
                                </NavLink>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    {EXTERNAL_LINKS.map(({ href, label, icon: Icon }) => (
                        <SidebarMenuItem key={href}>
                            <SidebarMenuButton asChild>
                                <a href={href} target="_blank" rel="noreferrer">
                                    <Icon />
                                    <span>{label}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
                <NetworkPicker />
            </SidebarFooter>
        </Sidebar>
    );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <SidebarProvider>
            <AppSidebar />

            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-tertiary bg-background/80 px-4 backdrop-blur">
                    <AppLogo className="size-8 md:hidden" />

                    <TonConnectButton className="ml-auto" />
                    <ThemeSwitcher />
                    <div className="md:hidden">
                        <SidebarTrigger />
                    </div>
                </header>

                <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>

                <footer className="py-2 text-center text-xs text-tertiary-foreground">
                    <p>Powered by AppKit & TonConnect</p>
                </footer>
            </SidebarInset>
        </SidebarProvider>
    );
};
