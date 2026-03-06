/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Modal } from './modal';

import type { AgentWallet } from '@/features/agents';
import { useAgentOperations } from '@/features/agents';

interface ChangePublicKeyModalProps {
    agent: AgentWallet | null;
    onClose: () => void;
    onSuccess?: () => void | Promise<void>;
}

export function ChangePublicKeyModal({ agent, onClose, onSuccess }: ChangePublicKeyModalProps) {
    const { changeAgentPublicKey, isPending } = useAgentOperations();
    const [publicKey, setPublicKey] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!agent) {
            return;
        }
        setPublicKey(agent.operatorPubkey);
    }, [agent]);

    if (!agent) return null;

    const trimmedPublicKey = publicKey.trim();
    const isChanged = trimmedPublicKey !== agent.operatorPubkey;
    const uiPending = isPending || isSubmitting;

    const handleSubmit = async () => {
        if (!isChanged) {
            return;
        }

        try {
            setIsSubmitting(true);
            await changeAgentPublicKey(agent, trimmedPublicKey);
            await onSuccess?.();
            toast.success(`Updated operator public key for ${agent.name}`);
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update operator public key';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal open={!!agent} onClose={onClose} title="Change operator public key">
            <div className="space-y-4">
                <input
                    type="text"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="0x... or decimal"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 font-mono text-white placeholder-neutral-700 outline-none transition-colors focus:border-amber-500/50"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && void handleSubmit()}
                />

                <p className="text-xs leading-relaxed text-neutral-500">
                    Enter a new operator key in hex (`0x...`) or decimal format. You can use this to reactivate a revoked
                    agent.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-full border border-white/[0.1] py-3 text-sm text-neutral-400 transition-colors hover:bg-white/[0.04] hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => void handleSubmit()}
                        disabled={uiPending || !isChanged}
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
