/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AgentStatus } from '@/features/agents';

const statusColors: Record<AgentStatus, string> = {
    active: 'bg-emerald-500',
    revoked: 'bg-red-500',
};

const statusLabels: Record<AgentStatus, string> = {
    active: 'Active',
    revoked: 'Revoked',
};

export function StatusDot({ status, showLabel = false }: { status: AgentStatus; showLabel?: boolean }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${statusColors[status]}`} />
            {showLabel && <span className="text-xs text-neutral-400">{statusLabels[status]}</span>}
        </span>
    );
}
