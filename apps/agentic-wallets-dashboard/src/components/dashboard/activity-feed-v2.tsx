/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Bot, Cog, ExternalLink, Info, RefreshCw, User } from 'lucide-react';

import { Modal } from '@/components/modals/modal';
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
    return new Date(timestamp * 1000).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function formatDateTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
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
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getProtocolLabel(protocol: AgentActivityItem['protocol']): string | null {
    if (protocol === 'stonfi') return 'STON.fi';
    if (protocol === 'dedust') return 'DeDust';
    if (protocol === 'other') return 'Swap';
    return null;
}

function getTonviewerHref(hash?: string): string | null {
    if (!hash) return null;
    return `https://tonviewer.com/transaction/${hash.replace(/^0x/, '')}`;
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

function ActorPill({ actor }: { actor: AgentActivityItem['actor'] }) {
    if (actor === 'agent') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
                <Bot size={10} />
                Agent
            </span>
        );
    }

    if (actor === 'user') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-400/30 bg-white/[0.08] px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-200">
                <User size={10} />
                User
            </span>
        );
    }

    return null;
}

function AmountCell({ item, compact = false }: { item: AgentActivityItem; compact?: boolean }) {
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
        if (compact) return null;
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

function ActivityDetailsModal({
    item,
    isOpen,
    isRevoked,
    onClose,
    onMarkUnexpected,
}: {
    item: AgentActivityItem | null;
    isOpen: boolean;
    isRevoked: boolean;
    onClose: () => void;
    onMarkUnexpected: (item: AgentActivityItem) => void;
}) {
    if (!item) {
        return null;
    }

    const protocolLabel = getProtocolLabel(item.protocol);
    const tonviewerHref = getTonviewerHref(item.hash);

    return (
        <Modal open={isOpen} onClose={onClose} title="Transaction details">
            <div className="space-y-4">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-neutral-100">{item.actionLabel}</p>
                        <AmountCell item={item} />
                    </div>
                    <p className="text-xs text-neutral-500">{formatDateTime(item.timestamp)}</p>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                    <div className="flex flex-wrap gap-1.5">
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
                        <ActorPill actor={item.actor} />
                        {item.risk === 'unexpected' && (
                            <span className="rounded-full border border-red-500/35 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">
                                Unexpected
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-sm">
                    <DetailRow label="Counterparty" value={item.counterparty?.shortLabel ?? 'Unknown'} />
                    <DetailRow label="Direction" value={item.direction} />
                    <DetailRow label="Type" value={item.type} />
                    {item.hash && <DetailRow label="Tx hash" value={`${item.hash.slice(0, 10)}...${item.hash.slice(-8)}`} />}
                </div>

                {!isRevoked && item.canMarkUnexpected && (
                    <button
                        type="button"
                        onClick={() => {
                            onMarkUnexpected(item);
                            onClose();
                        }}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-neutral-500/35 px-3 py-2 text-sm text-neutral-300 transition-colors hover:border-neutral-400/55 hover:text-neutral-100"
                    >
                        <AlertTriangle size={14} />
                        Mark as unexpected
                    </button>
                )}

                {tonviewerHref && (
                    <a
                        href={tonviewerHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-neutral-200 transition-colors hover:bg-white/[0.06]"
                    >
                        Open in Tonviewer
                        <ExternalLink size={14} />
                    </a>
                )}
            </div>
        </Modal>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <span className="text-xs uppercase tracking-wide text-neutral-500">{label}</span>
            <span className="text-right text-sm text-neutral-200">{value}</span>
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
    const [selectedItem, setSelectedItem] = useState<AgentActivityItem | null>(null);

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
        <>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
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
                                        const tonviewerHref = getTonviewerHref(item.hash);

                                        return (
                                            <article
                                                key={item.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setSelectedItem(item)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter' || event.key === ' ') {
                                                        event.preventDefault();
                                                        setSelectedItem(item);
                                                    }
                                                }}
                                                className="relative rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-3 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-amber-400/40 sm:px-4"
                                            >
                                                <button
                                                    type="button"
                                                    aria-label="Open transaction details"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setSelectedItem(item);
                                                    }}
                                                    className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.03] text-neutral-300 transition-colors hover:border-white/[0.22] hover:text-neutral-100 sm:hidden"
                                                >
                                                    <Info size={14} />
                                                </button>

                                                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                                                    <DirectionIcon item={item} />

                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="truncate text-[15px] font-semibold text-neutral-100">
                                                                {item.actionLabel}
                                                            </p>
                                                            <span className="hidden sm:inline-flex">
                                                                <ActorPill actor={item.actor} />
                                                            </span>
                                                        </div>

                                                        <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                                                            <span className="max-w-[10rem] truncate">
                                                                {item.counterparty?.shortLabel ?? 'Unknown counterparty'}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{formatTime(item.timestamp)}</span>
                                                            {tonviewerHref && (
                                                                <>
                                                                    <span className="hidden sm:inline">•</span>
                                                                    <a
                                                                        href={tonviewerHref}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        onClick={(event) => event.stopPropagation()}
                                                                        className="hidden items-center gap-1 transition-colors hover:text-neutral-300 sm:inline-flex"
                                                                    >
                                                                        Tonviewer
                                                                        <ExternalLink size={11} />
                                                                    </a>
                                                                </>
                                                            )}
                                                        </div>

                                                        <div className="mt-2 hidden flex-wrap gap-1.5 sm:flex">
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

                                                    <div className="col-span-2 mt-1 flex items-center justify-between sm:col-span-1 sm:mt-0 sm:min-w-[170px] sm:flex-col sm:items-end sm:self-stretch sm:justify-between">
                                                        <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                                                            <AmountCell item={item} compact />
                                                        </div>

                                                        {!isRevoked && item.canMarkUnexpected && (
                                                            <button
                                                                type="button"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    onMarkUnexpected(item);
                                                                }}
                                                                className="hidden items-center gap-1.5 rounded-full border border-neutral-500/35 px-3 py-1 text-xs text-neutral-300 transition-colors hover:border-neutral-400/55 hover:text-neutral-100 sm:inline-flex"
                                                            >
                                                                <AlertTriangle size={12} />
                                                                Unexpected?
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            <ActivityDetailsModal
                item={selectedItem}
                isOpen={selectedItem != null}
                isRevoked={isRevoked}
                onClose={() => setSelectedItem(null)}
                onMarkUnexpected={onMarkUnexpected}
            />
        </>
    );
}
