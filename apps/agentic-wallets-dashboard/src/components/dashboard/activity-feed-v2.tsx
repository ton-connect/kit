/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Bot, Cog, ExternalLink, RefreshCw, User } from 'lucide-react';

import type { AgentActivityItem } from '@/features/agents';

type FeedFilter = 'all' | 'user' | 'agent';

interface ActivityFeedV2Props {
    items: AgentActivityItem[] | undefined;
    isLoading: boolean;
    isRevoked: boolean;
    onMarkUnexpected: (item: AgentActivityItem) => void;
}

interface ActivityDayGroup {
    label: string;
    items: AgentActivityItem[];
}

const FILTERS: Array<{ key: FeedFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'user', label: 'User' },
    { key: 'agent', label: 'Agent' },
];

const CATEGORY_LABELS: Record<AgentActivityItem['category'], string> = {
    ton: 'TON',
    jetton: 'Jetton',
    nft: 'NFT',
    swap: 'Swap',
    contract: 'Contract',
    agent_ops: 'Agent op',
    system: 'System',
};

const CATEGORY_STYLES: Record<AgentActivityItem['category'], string> = {
    ton: 'border-amber-500/35 bg-amber-500/10 text-amber-200',
    jetton: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200',
    nft: 'border-rose-500/35 bg-rose-500/10 text-rose-200',
    swap: 'border-lime-500/35 bg-lime-500/10 text-lime-200',
    contract: 'border-neutral-500/35 bg-white/[0.05] text-neutral-300',
    agent_ops: 'border-amber-500/35 bg-amber-500/10 text-amber-200',
    system: 'border-neutral-500/35 bg-white/[0.05] text-neutral-300',
};

function formatTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function getDayLabel(tsSeconds: number): string {
    const now = new Date();
    const date = new Date(tsSeconds * 1000);

    const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const diffDays = Math.round((nowStart - dateStart) / 86_400_000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getProtocolLabel(protocol: AgentActivityItem['protocol']): string | null {
    if (protocol === 'stonfi') return 'STON.fi';
    if (protocol === 'dedust') return 'DeDust';
    if (protocol === 'other') return 'Swap';
    return null;
}

function DirectionIcon({ item }: { item: AgentActivityItem }) {
    const isIncoming = item.direction === 'incoming';
    const isOutgoing = item.direction === 'outgoing';
    const icon = isIncoming ? (
        <ArrowDownLeft size={16} />
    ) : isOutgoing ? (
        <ArrowUpRight size={16} />
    ) : item.category === 'swap' ? (
        <RefreshCw size={15} />
    ) : (
        <Cog size={15} />
    );

    const colorClass = isIncoming
        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
        : isOutgoing
          ? 'border-amber-500/30 bg-amber-500/15 text-amber-200'
          : 'border-white/[0.1] bg-white/[0.06] text-neutral-400';

    return (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${colorClass}`}>
            {icon}
        </div>
    );
}

function AmountCell({ item }: { item: AgentActivityItem }) {
    if (item.category === 'swap' && item.swap) {
        return (
            <div className="flex flex-col items-end gap-0.5">
                {item.swap.sent && (
                    <div className="flex items-center gap-1.5">
                        {item.swap.sent.iconUrl && (
                            <img
                                src={item.swap.sent.iconUrl}
                                alt={item.swap.sent.symbol}
                                className="h-4 w-4 rounded-full border border-white/[0.15] bg-black/30 object-cover"
                            />
                        )}
                        <p className="font-mono text-xs font-medium tabular-nums text-neutral-300 sm:text-sm">
                            -{item.swap.sent.amount} {item.swap.sent.symbol}
                        </p>
                    </div>
                )}
                {item.swap.received && (
                    <div className="flex items-center gap-1.5">
                        {item.swap.received.iconUrl && (
                            <img
                                src={item.swap.received.iconUrl}
                                alt={item.swap.received.symbol}
                                className="h-4 w-4 rounded-full border border-white/[0.15] bg-black/30 object-cover"
                            />
                        )}
                        <p className="font-mono text-xs font-semibold tabular-nums text-emerald-400 sm:text-sm">
                            +{item.swap.received.amount} {item.swap.received.symbol}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    if (item.category === 'nft' && item.thumbnailUrl) {
        return (
            <img
                src={item.thumbnailUrl}
                alt="NFT"
                className="h-11 w-11 rounded-lg border border-white/[0.15] bg-black/30 object-cover"
            />
        );
    }

    if (!item.amount) {
        return <p className="text-sm text-neutral-500">—</p>;
    }

    const amountClass = item.amount.isPositive ? 'text-emerald-400' : 'text-neutral-200';

    return (
        <div className="flex items-center gap-2">
            {item.amount.iconUrl && (
                <img
                    src={item.amount.iconUrl}
                    alt={item.amount.symbol}
                    className="h-5 w-5 rounded-full border border-white/[0.15] bg-black/30 object-cover"
                />
            )}
            <p className={`font-mono text-sm font-semibold tabular-nums sm:text-base ${amountClass}`}>
                {item.amount.signed} {item.amount.symbol}
            </p>
        </div>
    );
}

function ActivitySkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                    <div className="animate-pulse">
                        <div className="mb-2 h-4 w-1/3 rounded bg-white/[0.08]" />
                        <div className="mb-2 h-3 w-1/2 rounded bg-white/[0.06]" />
                        <div className="h-3 w-1/4 rounded bg-white/[0.06]" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ActivityFeedV2({ items, isLoading, isRevoked, onMarkUnexpected }: ActivityFeedV2Props) {
    const [filter, setFilter] = useState<FeedFilter>('all');

    const filteredItems = useMemo(() => {
        const activityItems = items ?? [];
        if (filter === 'all') return activityItems;
        return activityItems.filter((item) => item.actor === filter);
    }, [items, filter]);

    const groups = useMemo<ActivityDayGroup[]>(() => {
        const grouped = new Map<string, AgentActivityItem[]>();
        for (const item of filteredItems) {
            const label = getDayLabel(item.timestamp);
            const bucket = grouped.get(label);
            if (bucket) {
                bucket.push(item);
            } else {
                grouped.set(label, [item]);
            }
        }
        return Array.from(grouped.entries()).map(([label, dayItems]) => ({ label, items: dayItems }));
    }, [filteredItems]);

    return (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-wider text-neutral-600">Activity Feed</p>
                {isLoading && <span className="text-[11px] text-neutral-600">Updating...</span>}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                {FILTERS.map((tab) => {
                    const isActive = filter === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setFilter(tab.key)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                isActive
                                    ? 'border-amber-500/45 bg-amber-500/20 text-amber-200'
                                    : 'border-white/[0.08] bg-white/[0.03] text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {isLoading && !items ? (
                <ActivitySkeleton />
            ) : groups.length === 0 ? (
                <p className="text-sm text-neutral-500">
                    {filter === 'all' ? 'No activity yet.' : `No ${filter}-triggered activity yet.`}
                </p>
            ) : (
                <div className="space-y-4">
                    {groups.map((group) => (
                        <section key={group.label}>
                            <p className="mb-2 text-xs uppercase tracking-wider text-neutral-600">{group.label}</p>
                            <div className="space-y-2">
                                {group.items.map((item) => {
                                    const protocolLabel = getProtocolLabel(item.protocol);

                                    return (
                                        <div
                                            key={item.id}
                                            className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
                                        >
                                            <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                                                <DirectionIcon item={item} />

                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-[15px] font-semibold text-neutral-100">
                                                            {item.actionLabel}
                                                        </p>
                                                        {item.actor === 'agent' && (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
                                                                <Bot size={10} />
                                                                Agent
                                                            </span>
                                                        )}
                                                        {item.actor === 'user' && (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-400/30 bg-white/[0.08] px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-200">
                                                                <User size={10} />
                                                                User
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
                                                        <span className="max-w-full truncate">
                                                            {item.counterparty?.shortLabel ?? 'Unknown counterparty'}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{formatTime(item.timestamp)}</span>
                                                        {item.hash && (
                                                            <>
                                                                <span>•</span>
                                                                <a
                                                                    href={`https://tonviewer.com/transaction/${item.hash.replace(/^0x/, '')}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1 text-neutral-500 transition-colors hover:text-neutral-300"
                                                                >
                                                                    Tonviewer
                                                                    <ExternalLink size={11} />
                                                                </a>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        <span
                                                            className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${CATEGORY_STYLES[item.category]}`}
                                                        >
                                                            {CATEGORY_LABELS[item.category]}
                                                        </span>
                                                        {protocolLabel && (
                                                            <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-200">
                                                                {protocolLabel}
                                                            </span>
                                                        )}
                                                        {item.risk === 'unexpected' && (
                                                            <span className="rounded-full border border-red-500/35 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">
                                                                Unexpected
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2 sm:min-w-[170px] sm:self-stretch sm:justify-between">
                                                    <AmountCell item={item} />
                                                    {!isRevoked && item.canMarkUnexpected && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onMarkUnexpected(item)}
                                                            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-500/35 px-3 py-1 text-xs text-neutral-300 transition-colors hover:border-neutral-400/55 hover:text-neutral-100 sm:mt-auto"
                                                        >
                                                            <AlertTriangle size={12} />
                                                            Unexpected?
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
