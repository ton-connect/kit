/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import type { AgentWallet } from '@/features/agents';

export function DismissedSection({ agents }: { agents: AgentWallet[] }) {
    const [open, setOpen] = useState(false);

    if (agents.length === 0) return null;

    return (
        <div>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 text-xs text-neutral-600 transition-colors hover:text-neutral-400"
            >
                <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-0' : '-rotate-90'}`} />
                {agents.length} dismissed wallet{agents.length > 1 ? 's' : ''}
            </button>

            {open && (
                <div className="mt-3 space-y-2 animate-fade-in">
                    {agents.map((agent) => (
                        <div
                            key={agent.id}
                            className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3"
                        >
                            <div>
                                <p className="text-sm text-neutral-500">{agent.name}</p>
                                <p className="text-[10px] text-neutral-700">{agent.source}</p>
                            </div>
                            <span className="text-xs text-neutral-600">Archived</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
