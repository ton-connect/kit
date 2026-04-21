/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { Coins, ArrowLeftRight, Sparkles, BookOpen, Github, PenLine, CreditCard } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

import { AppLogo } from '../app-logo';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/core/components/sidebar';
import { NetworkPicker } from '@/features/network';
import { WalletInfo } from '@/features/wallet';

const NAV_LINKS: readonly { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { to: '/', label: 'Mint', icon: Sparkles },
    { to: '/swap', label: 'Swap', icon: ArrowLeftRight },
    { to: '/staking', label: 'Staking', icon: Coins },
    { to: '/onramp', label: 'Buy', icon: CreditCard },
    { to: '/sign', label: 'Sign Message', icon: PenLine },
];

const EXTERNAL_LINKS: readonly { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { href: 'https://docs.ton.org/ecosystem/appkit/overview', label: 'Docs', icon: BookOpen },
    { href: 'https://github.com/ton-connect/kit', label: 'GitHub', icon: Github },
];

export const AppSidebar: React.FC = () => {
    const { setOpenMobile, isMobile } = useSidebar();

    const closeOnMobile = () => {
        if (isMobile) setOpenMobile(false);
    };

    return (
        <Sidebar collapsible="icon" variant="floating">
            <SidebarHeader>
                <Link to="/" onClick={closeOnMobile} className="flex h-8 items-center gap-2 overflow-hidden">
                    <AppLogo className="size-8" />
                    <span className="truncate text-base font-bold group-data-[collapsible=icon]:hidden">
                        NFT Minter
                    </span>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                                <SidebarMenuItem key={to}>
                                    <NavLink to={to} end={to === '/'} onClick={closeOnMobile}>
                                        {({ isActive }) => (
                                            <SidebarMenuButton isActive={isActive} tooltip={label}>
                                                <Icon />
                                                <span>{label}</span>
                                            </SidebarMenuButton>
                                        )}
                                    </NavLink>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    {EXTERNAL_LINKS.map(({ href, label, icon: Icon }) => (
                        <SidebarMenuItem key={href}>
                            <SidebarMenuButton asChild tooltip={label}>
                                <a href={href} target="_blank" rel="noreferrer">
                                    <Icon />
                                    <span>{label}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
                <div className="group-data-[collapsible=icon]:hidden">
                    <NetworkPicker />
                </div>
                <WalletInfo />
            </SidebarFooter>
        </Sidebar>
    );
};
