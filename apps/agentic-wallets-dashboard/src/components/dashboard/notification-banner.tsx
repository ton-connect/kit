/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AgentWallet } from '@/features/agents';

interface NotificationBannerProps {
    agents: AgentWallet[];
    onView: (id: string) => void;
    onRevoke: (id: string) => void;
    onMarkAllKnown: () => void;
}

export function NotificationBanner({ agents, onView, onRevoke, onMarkAllKnown }: NotificationBannerProps) {
    if (agents.length === 0) return null;

    return (
        <div className="space-y-2 animate-slide-up">
            {agents.length > 1 && (
                <div className="flex items-center justify-between rounded-xl border border-amber-500/10 bg-amber-500/[0.04] px-4 py-2.5">
                    <span className="text-xs text-amber-500/80">
                        {agents.length} new agent wallet{agents.length > 1 ? 's' : ''} detected
                    </span>
                    <button
                        onClick={onMarkAllKnown}
                        className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
                    >
                        Mark as seen
                    </button>
                </div>
            )}

            {agents.map((agent) => (
                <div
                    key={agent.id}
                    className="flex items-center gap-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.04] px-4 py-3"
                >
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 animate-pulse" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm text-neutral-300">
                            New agent wallet detected &mdash;{' '}
                            <span className="font-medium text-white">&ldquo;{agent.name}&rdquo;</span>
                        </p>
                        <p className="text-[10px] text-neutral-600">Created by {agent.source}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <button
                            onClick={() => onView(agent.id)}
                            className="rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-black transition-colors hover:bg-amber-400"
                        >
                            View
                        </button>
                        <button
                            onClick={() => onRevoke(agent.id)}
                            className="rounded-full border border-red-500/25 px-3 py-1 text-xs text-red-300 transition-colors hover:border-red-500/50 hover:text-red-200"
                        >
                            Revoke
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
