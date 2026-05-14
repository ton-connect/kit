/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TonConnectButton, useAddress } from '@ton/appkit-react';
import { ArrowLeftRight, BookOpen, Coins, ExternalLink, Github, ImageIcon, Sparkles, Wallet } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import type { ComponentType, FC, ReactNode } from 'react';

import { AppLogo } from '../../app-logo';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarSeparator,
    SidebarTrigger,
    useSidebar,
} from '../../sidebar';
import { BalanceCard } from '../balance-card';
import { ThemeSwitcher } from '../theme-switcher';

// import { NetworkPicker } from '@/features/network';

interface LayoutProps {
    children: ReactNode;
    title?: string | ReactNode;
}

type NavGroupLink = { to: string; label: string; icon: ComponentType<{ className?: string }> };

const NAV_GROUPS: readonly { label?: string; links: readonly NavGroupLink[] }[] = [
    {
        links: [{ to: '/', label: 'Mint', icon: Sparkles }],
    },
    {
        label: 'Assets',
        links: [
            { to: '/jettons', label: 'Jettons', icon: Wallet },
            { to: '/nfts', label: 'NFTs', icon: ImageIcon },
        ],
    },
    {
        label: 'DeFi',
        links: [
            { to: '/swap', label: 'Swap', icon: ArrowLeftRight },
            { to: '/staking', label: 'Staking', icon: Coins },
        ],
    },
];

const EXTERNAL_LINKS: readonly { href: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
    { href: 'https://docs.ton.org/ecosystem/appkit/overview', label: 'Docs', icon: BookOpen },
    { href: 'https://github.com/ton-connect/kit', label: 'GitHub', icon: Github },
];

const AppSidebar: FC = () => {
    const { setOpenMobile, isMobile } = useSidebar();
    const address = useAddress();

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
                {address && (
                    <>
                        <SidebarGroup>
                            <BalanceCard />
                        </SidebarGroup>

                        <SidebarSeparator />
                    </>
                )}

                {NAV_GROUPS.map((group, i) => (
                    <SidebarGroup key={group.label ?? `group-${i}`}>
                        {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
                        <SidebarMenu>
                            {group.links.map(({ to, label, icon: Icon }) => (
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
                ))}
            </SidebarContent>

            <SidebarSeparator />

            <SidebarFooter>
                <SidebarMenu>
                    {EXTERNAL_LINKS.map(({ href, label, icon: Icon }) => (
                        <SidebarMenuItem key={href}>
                            <SidebarMenuButton asChild>
                                <a href={href} target="_blank" rel="noreferrer">
                                    <Icon />
                                    <span>{label}</span>
                                    <ExternalLink className="ml-auto text-tertiary-foreground" />
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
                {/* <NetworkPicker /> */}
            </SidebarFooter>
        </Sidebar>
    );
};

export const Layout: FC<LayoutProps> = ({ children, title }) => {
    return (
        <SidebarProvider>
            <AppSidebar />

            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-tertiary bg-background/80 px-4 backdrop-blur">
                    <AppLogo className="size-8 md:hidden" />
                    <div className="hidden text-lg font-semibold md:flex md:justify-center md:items-center">
                        {typeof title === 'string' ? <h1>{title}</h1> : title}
                    </div>

                    <div className="ml-auto">
                        <TonConnectButton />
                    </div>
                    <ThemeSwitcher />
                    <div className="md:hidden">
                        <SidebarTrigger />
                    </div>
                </header>

                <main className="mx-auto w-full max-w-4xl flex-1 p-4">
                    <div className="w-full flex justify-start items-center md:hidden">
                        {typeof title === 'string' ? <h1 className="mb-2 text-lg font-semibold">{title}</h1> : title}
                    </div>

                    {children}
                </main>

                <footer className="pt-2 pb-4 text-center text-xs text-tertiary-foreground">
                    <p>Powered by AppKit & TON Connect</p>
                </footer>
            </SidebarInset>
        </SidebarProvider>
    );
};
