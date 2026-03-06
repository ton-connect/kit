/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppKit, useBalanceByAddress, useNetwork } from '@ton/appkit-react';
import { ArrowLeft, AlertTriangle, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { useAgentActivity, useAgentOperations, useAgents, useAgentsStore } from '@/features/agents';
import type { AgentWallet } from '@/features/agents';
import { StatusDot } from '@/components/shared/status-dot';
import { CopyableAddress, CopyableValue } from '@/components/shared/copyable-address';
import { JettonBalances } from '@/components/shared/jetton-balances';
import { NftBalances } from '@/components/shared/nft-balances';
import { FundModal } from '@/components/modals/fund-modal';
import { WithdrawModal } from '@/components/modals/withdraw-modal';
import { RevokeModal } from '@/components/modals/revoke-modal';
import { RenameModal } from '@/components/modals/rename-modal';
import { ChangePublicKeyModal } from '@/components/modals/change-public-key-modal';
import { UnexpectedActivityModal } from '@/components/modals/unexpected-activity-modal';
import { ActivityFeedV2 } from '@/components/dashboard/activity-feed-v2';
import { getAgentWalletState } from '@/features/agents/lib/agentic-wallet';
import { extractNameFromMetadata } from '@/features/agents/lib/metadata';
import { isSameTonAddress } from '@/features/agents/lib/address';

export function AgentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const appKit = useAppKit();
    const markKnown = useAgentsStore((s) => s.markKnown);
    const { agents, refresh, isLoading: isAgentsLoading } = useAgents();
    const { revokeAgentWallet, isPending: isAgentOperationPending } = useAgentOperations();
    const listedAgent = agents.find(
        (a) => id && (a.id === id || isSameTonAddress(a.id, id) || isSameTonAddress(a.address, id)),
    );
    const network = useNetwork();
    const { data: fallbackAgent, isLoading: isFallbackAgentLoading } = useQuery({
        queryKey: ['agent-detail-fallback', network?.chainId, id],
        enabled: !!network && !!id && !isAgentsLoading && !listedAgent,
        staleTime: 30_000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: false,
        queryFn: async (): Promise<AgentWallet | null> => {
            if (!network || !id) {
                return null;
            }

            const client = appKit.networkManager.getClient(network);
            const state = await getAgentWalletState(client, id);
            if (!state.isInitialized) {
                return null;
            }

            const name = extractNameFromMetadata(state.nftItemContent) ?? `Agent ${id.slice(0, 6)}`;
            const nowIso = new Date().toISOString();

            return {
                id,
                name,
                address: id,
                operatorPubkey: `0x${state.operatorPublicKey.toString(16)}`,
                originOperatorPublicKey: `0x${state.originOperatorPublicKey.toString(16)}`,
                ownerAddress: state.ownerAddress?.toString() ?? '',
                createdAt: nowIso,
                detectedAt: nowIso,
                isNew: false,
                status: state.operatorPublicKey === 0n ? 'revoked' : 'active',
                source: 'On-chain',
                collectionAddress: state.collectionAddress.toString(),
                nftItemContent: state.nftItemContent,
            };
        },
    });
    const agent = listedAgent ?? fallbackAgent ?? null;
    const { data: balance } = useBalanceByAddress({ address: agent?.address ?? '', network });
    const { data: activity, isLoading: isActivityLoading } = useAgentActivity(
        agent?.address ?? null,
        agent?.ownerAddress ?? null,
    );

    const [showFund, setShowFund] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [showRevoke, setShowRevoke] = useState(false);
    const [showRename, setShowRename] = useState(false);
    const [showChangePublicKey, setShowChangePublicKey] = useState(false);
    const [showUnexpected, setShowUnexpected] = useState(false);

    useEffect(() => {
        if (agent) {
            markKnown(agent.id);
        }
    }, [agent, markKnown]);

    if (!agent) {
        if (isAgentsLoading || isFallbackAgentLoading) {
            return (
                <div className="flex min-h-[50vh] items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-amber-500" />
                </div>
            );
        }

        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 animate-fade-in">
                <p className="text-neutral-500">Agent not found</p>
                <button onClick={() => navigate('/')} className="text-sm text-amber-500 hover:text-amber-400">
                    Back to dashboard
                </button>
            </div>
        );
    }

    const balanceStr = balance != null ? parseFloat(balance).toFixed(2) : '—';
    const isZero = balance != null && parseFloat(balance) === 0;
    const isRevoked = agent.status === 'revoked';
    const createdDate = new Date(agent.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="animate-fade-in">
            <Link
                to="/"
                className="mb-6 inline-flex items-center gap-1.5 text-xs text-neutral-500 transition-colors hover:text-white"
            >
                <ArrowLeft size={14} />
                Back to dashboard
            </Link>

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                    <StatusDot status={agent.status} />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
                            <button
                                onClick={() => setShowRename(true)}
                                className="text-neutral-600 transition-colors hover:text-white"
                            >
                                <Pencil size={14} />
                            </button>
                        </div>
                        <p className="text-xs text-neutral-500">
                            Created by {agent.source} on {createdDate}
                        </p>
                    </div>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end sm:gap-3">
                    {!isRevoked && (
                        <>
                            <button
                                onClick={() => setShowFund(true)}
                                className="order-1 w-full rounded-full bg-amber-500 px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-amber-400 sm:order-none sm:w-auto"
                            >
                                Fund
                            </button>
                            <button
                                onClick={() => setShowWithdraw(true)}
                                className="order-2 w-full rounded-full border border-white/[0.1] px-6 py-2.5 text-sm text-neutral-400 transition-colors hover:bg-white/[0.04] hover:text-white sm:order-none sm:w-auto"
                            >
                                Withdraw
                            </button>
                            <button
                                onClick={() => setShowRevoke(true)}
                                className="order-4 w-full rounded-full border border-red-500/25 bg-red-500/10 px-6 py-2.5 text-sm text-red-300 transition-colors hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-200 sm:order-none sm:w-auto"
                            >
                                Revoke
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setShowChangePublicKey(true)}
                        className="order-3 w-full rounded-full border border-white/[0.1] px-6 py-2.5 text-sm text-neutral-300 transition-colors hover:bg-white/[0.04] hover:text-white sm:order-none sm:w-auto"
                    >
                        Change key
                    </button>
                </div>
            </div>

            <div className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <p className="text-xs uppercase tracking-wider text-neutral-600">Agent Balance</p>
                <div className="mt-2 flex items-baseline gap-2">
                    {isZero && <AlertTriangle size={18} className="text-amber-500" />}
                    <span className="font-mono text-4xl font-semibold tabular-nums">{balanceStr}</span>
                    <span className="text-lg text-neutral-500">TON</span>
                </div>
                {isZero && (
                    <p className="mt-2 text-xs text-amber-500/70">
                        This agent is out of funds and can&apos;t execute transactions.
                    </p>
                )}
            </div>

            <div className="mb-8">
                <p className="mb-3 text-xs uppercase tracking-wider text-neutral-600">Jetton Balances</p>
                <JettonBalances address={agent.address} network={network} />
            </div>

            <div className="mb-8">
                <p className="mb-3 text-xs uppercase tracking-wider text-neutral-600">NFT Assets</p>
                <NftBalances address={agent.address} network={network} />
            </div>

            {isRevoked && (
                <div className="mb-8 rounded-xl border border-red-500/10 bg-red-500/[0.04] px-4 py-3">
                    <p className="text-sm text-red-400/80">
                        This agent is revoked (`operatorPublicKey = 0`). Set a new public key to reactivate it.
                    </p>
                </div>
            )}

            <div className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04]">
                <InfoRow label="Agent Address">
                    <CopyableAddress
                        address={agent.address}
                        adaptive
                        className="w-full justify-between sm:w-full sm:justify-end"
                    />
                </InfoRow>
                <InfoRow label="Operator Public Key">
                    <CopyableValue
                        value={agent.operatorPubkey}
                        adaptive
                        className="w-full justify-between sm:w-full sm:justify-end"
                    />
                </InfoRow>
                <InfoRow label="Origin Operator Public Key">
                    <CopyableValue
                        value={agent.originOperatorPublicKey}
                        adaptive
                        className="w-full justify-between sm:w-full sm:justify-end"
                    />
                </InfoRow>
                <InfoRow label="Owner Address">
                    <CopyableAddress
                        address={agent.ownerAddress}
                        adaptive
                        className="w-full justify-between sm:w-full sm:justify-end"
                    />
                </InfoRow>
                <InfoRow label="Created">{createdDate}</InfoRow>
                <InfoRow label="Source">{agent.source}</InfoRow>
            </div>

            <ActivityFeedV2
                items={activity}
                isLoading={isActivityLoading}
                isRevoked={isRevoked}
                onMarkUnexpected={() => setShowUnexpected(true)}
            />

            <FundModal agent={showFund ? agent : null} onClose={() => setShowFund(false)} onSuccess={refresh} />
            <WithdrawModal
                agent={showWithdraw ? agent : null}
                onClose={() => setShowWithdraw(false)}
                onSuccess={refresh}
            />
            <RevokeModal agent={showRevoke ? agent : null} onClose={() => setShowRevoke(false)} onSuccess={refresh} />
            <RenameModal agent={showRename ? agent : null} onClose={() => setShowRename(false)} onSuccess={refresh} />
            <ChangePublicKeyModal
                agent={showChangePublicKey ? agent : null}
                onClose={() => setShowChangePublicKey(false)}
                onSuccess={refresh}
            />
            <UnexpectedActivityModal
                agent={showUnexpected ? agent : null}
                onClose={() => setShowUnexpected(false)}
                isPending={isAgentOperationPending}
                onConfirm={async () => {
                    try {
                        await revokeAgentWallet(agent);
                        await refresh();
                        toast.success(`Marked ${agent.name} as unexpected and revoked.`);
                        setShowUnexpected(false);
                    } catch (error) {
                        const message = error instanceof Error ? error.message : 'Failed to revoke agent';
                        toast.error(message);
                    }
                }}
            />
        </div>
    );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-neutral-600">{label}</span>
            <div className="min-w-0 text-sm text-neutral-300 sm:ml-6 sm:flex-1 sm:text-right">{children}</div>
        </div>
    );
}
