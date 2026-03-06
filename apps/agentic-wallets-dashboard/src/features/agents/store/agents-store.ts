/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AgentsState {
    knownAgentIds: string[];
    markKnown: (id: string) => void;
    markManyKnown: (ids: string[]) => void;
}

/**
 * Persists discovered agent ids only to detect newly appeared wallets.
 * Business state (name/status/operator/content) is always read from chain.
 */
export const useAgentsStore = create<AgentsState>()(
    persist(
        (set) => ({
            knownAgentIds: [],
            markKnown: (id) => {
                set((state) => {
                    if (state.knownAgentIds.includes(id)) {
                        return state;
                    }
                    return { knownAgentIds: [...state.knownAgentIds, id] };
                });
            },
            markManyKnown: (ids) => {
                if (ids.length === 0) {
                    return;
                }
                set((state) => {
                    const known = new Set(state.knownAgentIds);
                    let changed = false;
                    for (const id of ids) {
                        if (!known.has(id)) {
                            known.add(id);
                            changed = true;
                        }
                    }
                    if (!changed) {
                        return state;
                    }
                    return { knownAgentIds: Array.from(known) };
                });
            },
        }),
        {
            name: 'agentic-wallets-known-agent-ids',
        },
    ),
);
