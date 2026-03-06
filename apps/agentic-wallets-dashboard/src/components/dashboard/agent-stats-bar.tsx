/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AgentWallet } from '@/features/agents';
import { formatUiAmountFixed } from '@/features/agents/lib/amount';

export function AgentStatsBar({ agents, totalBalanceTon }: { agents: AgentWallet[]; totalBalanceTon: string }) {
    const activeAgents = agents.filter((a) => a.status === 'active');
    const revokedCount = agents.length - activeAgents.length;

    return (
        <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
            <span className="text-sm text-neutral-400">
                <span className="font-medium text-white">{activeAgents.length}</span>{' '}
                {activeAgents.length === 1 ? 'agent' : 'agents'} active
            </span>
            <span className="text-neutral-700">&middot;</span>
            <span className="text-sm text-neutral-400">
                Total balance: <span className="font-medium text-white">{formatUiAmountFixed(totalBalanceTon, 2)} TON</span>
            </span>
            {revokedCount > 0 && (
                <>
                    <span className="text-neutral-700">&middot;</span>
                    <span className="text-sm text-neutral-500">{revokedCount} revoked</span>
                </>
            )}
        </div>
    );
}
