/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Link } from 'react-router-dom';

import { WalletButton } from '@/components/shared/wallet-button';

export function DashboardHeader() {
    return (
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
                <div className="flex min-w-0 items-center gap-2 sm:gap-6">
                    <Link to="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                        <AgentLogo />
                        <span className="text-xs font-semibold tracking-tight whitespace-nowrap sm:text-sm">
                            Agentic Wallets
                        </span>
                    </Link>
                    <Link
                        to="/create"
                        className="rounded-full border border-white/[0.1] px-2.5 py-1.5 text-xs text-neutral-300 transition-colors hover:border-white/[0.2] hover:text-white sm:px-3"
                    >
                        Create
                    </Link>
                </div>
                <WalletButton />
            </div>
        </header>
    );
}

function AgentLogo() {
    return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="26" height="26" rx="8" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
            <rect x="5" y="5" width="8" height="8" rx="2" fill="#f59e0b" fillOpacity="0.8" />
            <rect x="15" y="5" width="8" height="8" rx="2" fill="white" fillOpacity="0.15" />
            <rect x="5" y="15" width="8" height="8" rx="2" fill="white" fillOpacity="0.15" />
            <rect x="15" y="15" width="8" height="8" rx="2" fill="white" fillOpacity="0.08" />
        </svg>
    );
}
