/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAddress, useAppKit, useNetwork } from '@ton/appkit-react';
import { useNavigate } from 'react-router-dom';

import { useAgents } from '@/features/agents';
import type { AgentWallet } from '@/features/agents';
import { ConnectPrompt } from '@/components/dashboard/connect-prompt';
import { EmptyState } from '@/components/dashboard/empty-state';
import { AgentStatsBar } from '@/components/dashboard/agent-stats-bar';
import { NotificationBanner } from '@/components/dashboard/notification-banner';
import { AgentCard } from '@/components/dashboard/agent-card';
import { FundModal } from '@/components/modals/fund-modal';
import { WithdrawModal } from '@/components/modals/withdraw-modal';
import { RevokeModal } from '@/components/modals/revoke-modal';
import { formatUnitsTrimmed } from '@/features/agents/lib/amount';
import { mapWithConcurrency } from '@/features/agents/lib/async';

export function DashboardPage() {
    const address = useAddress();
    const appKit = useAppKit();
    const network = useNetwork();
    const navigate = useNavigate();

    const {
        agents,
        activeAgents,
        newAgents,
        isLoading,
        refresh,
        collectionAddress,
        markAgentKnown,
        markAgentsKnown,
    } = useAgents();

    const [fundAgent, setFundAgent] = useState<AgentWallet | null>(null);
    const [withdrawAgent, setWithdrawAgent] = useState<AgentWallet | null>(null);
    const [revokeAgent, setRevokeAgent] = useState<AgentWallet | null>(null);

    const orderedAgents = useMemo(() => {
        return [...agents].sort((a, b) => {
            if (a.isNew !== b.isNew) {
                return a.isNew ? -1 : 1;
            }
            if (a.status !== b.status) {
                return a.status === 'active' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }, [agents]);

    const agentAddresses = useMemo(() => Array.from(new Set(agents.map((agent) => agent.address))).sort(), [agents]);

    const { data: balancesByAddress = {} as Record<string, bigint> } = useQuery({
        queryKey: ['agentic-wallets-balances', network?.chainId, agentAddresses],
        enabled: !!network && agentAddresses.length > 0,
        queryFn: async (): Promise<Record<string, bigint>> => {
            if (!network) {
                return {};
            }

            const client = appKit.networkManager.getClient(network);
            const entries = await mapWithConcurrency(agentAddresses, 8, async (agentAddress) => {
                const balance = await client.getBalance(agentAddress);
                return [agentAddress, BigInt(balance)] as const;
            });

            return Object.fromEntries(entries);
        },
    });

    const totalBalanceNano = useMemo(
        () => activeAgents.reduce((acc, agent) => acc + (balancesByAddress[agent.address] ?? 0n), 0n),
        [activeAgents, balancesByAddress],
    );
    const totalBalanceTon = formatUnitsTrimmed(totalBalanceNano, 9);

    if (!address) {
        return <ConnectPrompt />;
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-amber-500" />
            </div>
        );
    }

    if (agents.length === 0) {
        if (!collectionAddress) {
            return (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 text-sm text-amber-200">
                    Collection address is not configured for the current network. Switch network or set
                    `VITE_AGENTIC_COLLECTION_MAINNET`/`VITE_AGENTIC_COLLECTION_TESTNET`.
                </div>
            );
        }
        return <EmptyState />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <AgentStatsBar agents={agents} totalBalanceTon={totalBalanceTon} />

            <NotificationBanner
                agents={newAgents}
                onView={(id) => {
                    markAgentKnown(id);
                    navigate(`/agent/${id}`);
                }}
                onRevoke={(id) => {
                    const agent = agents.find((a) => a.id === id) ?? null;
                    if (agent) {
                        markAgentKnown(id);
                        setRevokeAgent(agent);
                    }
                }}
                onMarkAllKnown={() => markAgentsKnown(newAgents.map((a) => a.id))}
            />

            <section>
                <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-neutral-500">Agents</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {orderedAgents.map((agent) => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            balanceNano={balancesByAddress[agent.address]}
                            onFund={() => {
                                markAgentKnown(agent.id);
                                setFundAgent(agent);
                            }}
                            onWithdraw={() => {
                                markAgentKnown(agent.id);
                                setWithdrawAgent(agent);
                            }}
                            onRevoke={() => {
                                markAgentKnown(agent.id);
                                setRevokeAgent(agent);
                            }}
                        />
                    ))}
                </div>
            </section>

            <FundModal agent={fundAgent} onClose={() => setFundAgent(null)} onSuccess={refresh} />
            <WithdrawModal agent={withdrawAgent} onClose={() => setWithdrawAgent(null)} onSuccess={refresh} />
            <RevokeModal agent={revokeAgent} onClose={() => setRevokeAgent(null)} onSuccess={refresh} />
        </div>
    );
}
