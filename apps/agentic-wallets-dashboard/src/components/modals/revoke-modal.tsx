/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { toast } from 'sonner';

import { Modal } from './modal';

import type { AgentWallet } from '@/features/agents';
import { useAgentOperations } from '@/features/agents';

interface RevokeModalProps {
    agent: AgentWallet | null;
    onClose: () => void;
    onSuccess?: () => void | Promise<void>;
}

export function RevokeModal({ agent, onClose, onSuccess }: RevokeModalProps) {
    const { revokeAgentWallet, isPending } = useAgentOperations();
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!agent) return null;
    const uiPending = isPending || isSubmitting;

    const handleRevoke = async () => {
        try {
            setIsSubmitting(true);
            await revokeAgentWallet(agent);
            await onSuccess?.();
            toast.success(`Revoked ${agent.name}. Operator key deactivated.`);
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to revoke agent';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal open={!!agent} onClose={onClose} title={`Revoke ${agent.name}`}>
            <div className="space-y-4">
                <div className="rounded-xl border border-red-500/10 bg-red-500/[0.04] px-4 py-3">
                    <p className="text-sm leading-relaxed text-red-400/90">
                        This will set the agent&apos;s operator key to `0`. The agent will no longer be able to sign
                        transactions until you set a new public key.
                    </p>
                </div>

                <p className="text-xs text-neutral-500">
                    You can restore agent access at any time from the agent page by changing the public key.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-full border border-white/[0.1] py-3 text-sm text-neutral-400 transition-colors hover:bg-white/[0.04] hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => void handleRevoke()}
                        disabled={uiPending}
                        className="flex-1 rounded-full bg-red-500 py-3 text-sm font-medium text-white transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {uiPending ? (
                            <span className="inline-flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                Revoking...
                            </span>
                        ) : (
                            'Revoke Agent'
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
