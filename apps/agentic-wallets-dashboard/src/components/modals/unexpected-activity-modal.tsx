/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Modal } from './modal';

import type { AgentWallet } from '@/features/agents';

interface UnexpectedActivityModalProps {
    agent: AgentWallet | null;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    isPending?: boolean;
}

export function UnexpectedActivityModal({ agent, onClose, onConfirm, isPending = false }: UnexpectedActivityModalProps) {
    if (!agent) return null;

    return (
        <Modal open={!!agent} onClose={onClose} title="Mark as unexpected?">
            <div className="space-y-4">
                <div className="rounded-xl border border-red-500/10 bg-red-500/[0.04] px-4 py-3">
                    <p className="text-sm leading-relaxed text-red-400/90">
                        This will mark the activity as unexpected and immediately revoke this agent wallet in one step.
                    </p>
                </div>

                <p className="text-xs text-neutral-500">
                    Continue only if you suspect compromised behavior or unauthorized actions.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="flex-1 rounded-full border border-white/[0.1] py-3 text-sm text-neutral-400 transition-colors hover:bg-white/[0.04] hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => void onConfirm()}
                        disabled={isPending}
                        className="flex-1 rounded-full bg-red-500 py-3 text-sm font-medium text-white transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isPending ? (
                            <span className="inline-flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                Revoking...
                            </span>
                        ) : (
                            'Mark as unexpected & revoke'
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
