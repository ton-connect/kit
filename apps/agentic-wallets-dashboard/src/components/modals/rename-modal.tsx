/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Modal } from './modal';

import type { AgentWallet } from '@/features/agents';
import { useAgentOperations } from '@/features/agents';

interface RenameModalProps {
    agent: AgentWallet | null;
    onClose: () => void;
    onSuccess?: () => void | Promise<void>;
}

function normalizeRenameError(error: unknown): string {
    const message = error instanceof Error ? error.message : 'Rename failed';
    const lower = message.toLowerCase();
    if (lower.includes('unsupported metadata format')) {
        return 'Unsupported metadata format for this wallet. Rename is available only for on-chain metadata (0x00).';
    }
    if (lower.includes('insufficient')) {
        return 'Insufficient gas for owner operation.';
    }
    if (lower.includes('rejected')) {
        return 'Transaction was rejected.';
    }
    if (lower.includes('exit code')) {
        return `Rename failed on-chain (${message})`;
    }
    return message;
}

export function RenameModal({ agent, onClose, onSuccess }: RenameModalProps) {
    const [name, setName] = useState('');
    const { renameAgentWallet, isPending } = useAgentOperations();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (agent) setName(agent.name);
    }, [agent]);

    if (!agent) return null;

    const trimmedName = name.trim();
    const isInvalidLength = trimmedName.length < 1 || trimmedName.length > 64;
    const uiPending = isPending || isSubmitting;

    const handleRename = async () => {
        if (isInvalidLength || trimmedName === agent.name) return;

        try {
            setIsSubmitting(true);
            await renameAgentWallet(agent, trimmedName);
            await onSuccess?.();
            toast.success(`Renamed to "${trimmedName}"`);
            onClose();
        } catch (error) {
            toast.error(normalizeRenameError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal open={!!agent} onClose={onClose} title="Rename agent">
            <div className="space-y-4">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Agent name"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder-neutral-700 outline-none transition-colors focus:border-amber-500/50"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && void handleRename()}
                />
                <p className="text-[11px] text-neutral-500">Name length: 1-64 characters.</p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-full border border-white/[0.1] py-3 text-sm text-neutral-400 transition-colors hover:bg-white/[0.04] hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => void handleRename()}
                        disabled={uiPending || isInvalidLength || trimmedName === agent.name}
                        className="flex-1 rounded-full bg-amber-500 py-3 text-sm font-medium text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {uiPending ? (
                            <span className="inline-flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                                Saving...
                            </span>
                        ) : (
                            'Save'
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
