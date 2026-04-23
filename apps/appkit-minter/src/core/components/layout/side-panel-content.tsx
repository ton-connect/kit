/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import type React from 'react';
import { ArrowLeftRight, BookOpen, Coins, Github, PenLine, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { BalanceCard } from './balance-card';

import { cn } from '@/core/lib/utils';
import { NetworkPicker } from '@/features/network';

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

interface SidePanelContentProps {
    onNavigate?: () => void;
}

export const SidePanelContent: FC<SidePanelContentProps> = ({ onNavigate }) => {
    return (
        <div className="flex flex-col gap-4">
            <BalanceCard />

            <nav className="flex flex-col gap-1">
                {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                            cn(
                                'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-secondary text-foreground'
                                    : 'text-tertiary-foreground hover:bg-secondary/60 hover:text-foreground',
                            )
                        }
                    >
                        <Icon className="size-4" />
                        {label}
                    </NavLink>
                ))}
            </nav>

            <div className="flex flex-col gap-1">
                {EXTERNAL_LINKS.map(({ href, label, icon: Icon }) => (
                    <a
                        key={href}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-tertiary-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                    >
                        <Icon className="size-4" />
                        {label}
                    </a>
                ))}
            </div>

            <NetworkPicker />
        </div>
    );
};
