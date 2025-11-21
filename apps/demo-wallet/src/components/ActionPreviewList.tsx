/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { memo, useMemo } from 'react';
import type { ToncenterEmulationResponse } from '@ton/walletkit';
import { emulationEvent } from '@ton/walletkit';

interface ActionPreviewListProps {
    emulationResult: ToncenterEmulationResponse;
    walletAddress?: string;
    title?: string;
    className?: string;
}

export const ActionPreviewList: React.FC<ActionPreviewListProps> = memo(
    ({ emulationResult, walletAddress, title = 'Actions:', className }) => {
        if (!walletAddress) {
            return null;
        }
        const event = useMemo(() => emulationEvent(emulationResult, walletAddress), [emulationResult, walletAddress]);

        return (
            <div className={className ? className : ''}>
                {title && <div className="font-semibold mb-1">{title}</div>}
                <div className="space-y-2">
                    {event.actions.map((a, idx) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const sp = (a as any).simplePreview as
                            | {
                                  name: string;
                                  description: string;
                                  value: string;
                                  valueImage?: string;
                                  accounts: Array<{ address: string; name?: string }>;
                              }
                            | undefined;
                        if (!sp) {
                            return (
                                <div key={`act-${idx}`} className="text-sm text-gray-700">
                                    {a.type}
                                </div>
                            );
                        }
                        return (
                            <div
                                key={`act-${idx}`}
                                className="flex items-start gap-3 p-2 border border-gray-200 rounded-lg"
                            >
                                {sp.valueImage ? (
                                    <img
                                        alt={sp.name}
                                        src={sp.valueImage}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                                        {a.type.slice(0, 1)}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm font-medium text-gray-900 truncate">{sp.name}</div>
                                        <div className="text-sm text-gray-800">{sp.value}</div>
                                    </div>
                                    {sp.description && (
                                        <div className="text-xs text-gray-500 mt-0.5">{sp.description}</div>
                                    )}
                                    {Array.isArray(sp.accounts) && sp.accounts.length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {sp.accounts.map((acc, i) => (
                                                <span
                                                    key={`acc-${i}`}
                                                    className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
                                                >
                                                    {acc.name ?? shortenAddress(acc.address)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    },
);

function shortenAddress(addr?: string): string {
    if (!addr) return '';
    const a = String(addr);
    return a.length <= 12 ? a : `${a.slice(0, 6)}...${a.slice(-6)}`;
}
