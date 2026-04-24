/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useMemo, useState } from 'react';
import type { FC } from 'react';
import { useConnectedWallets, useDisconnect, useSelectedWallet } from '@ton/appkit-react';
import { PRIVY_DEFAULT_CONNECTOR_ID, TONCONNECT_DEFAULT_CONNECTOR_ID } from '@ton/appkit';
import { Check, Copy, LogOut, Wallet } from 'lucide-react';

import { cn } from '@/core/lib/utils';

const truncateAddress = (address: string): string => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 4)}…${address.slice(-4)}`;
};

const connectorLabel = (connectorId: string): string => {
    if (connectorId === TONCONNECT_DEFAULT_CONNECTOR_ID) return 'TonConnect';
    if (connectorId === PRIVY_DEFAULT_CONNECTOR_ID) return 'Privy';
    return connectorId;
};

export const WalletSelector: FC = () => {
    const wallets = useConnectedWallets();
    const [selectedWallet, setWalletId] = useSelectedWallet();
    const { mutate: disconnect, isPending: isDisconnecting } = useDisconnect();
    const [copiedWalletId, setCopiedWalletId] = useState<string | null>(null);

    const selectedWalletId = selectedWallet?.getWalletId() ?? null;

    const distinctConnectorIds = useMemo(() => {
        const ids = new Set<string>();
        for (const w of wallets) ids.add(w.connectorId);
        return Array.from(ids);
    }, [wallets]);

    const handleCopy = useCallback(async (walletId: string, address: string) => {
        if (!address) return;
        await navigator.clipboard.writeText(address);
        setCopiedWalletId(walletId);
        setTimeout(() => setCopiedWalletId((prev) => (prev === walletId ? null : prev)), 2000);
    }, []);

    const handleSelect = useCallback(
        (walletId: string) => {
            if (walletId !== selectedWalletId) setWalletId(walletId);
        },
        [selectedWalletId, setWalletId],
    );

    const handleDisconnect = useCallback(
        (connectorId: string) => {
            disconnect({ connectorId });
        },
        [disconnect],
    );

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
                {wallets.map((wallet) => {
                    const walletId = wallet.getWalletId();
                    const address = wallet.getAddress();
                    const isActive = walletId === selectedWalletId;
                    const isCopied = copiedWalletId === walletId;

                    return (
                        <button
                            key={walletId}
                            type="button"
                            onClick={() => handleSelect(walletId)}
                            className={cn(
                                'flex items-center gap-2 rounded-md border p-1.5 text-left transition-colors',
                                isActive
                                    ? 'border-primary/60 bg-primary/10'
                                    : 'border-border bg-card/50 hover:bg-muted/40',
                            )}
                            aria-pressed={isActive}
                        >
                            <div
                                className={cn(
                                    'flex size-7 shrink-0 items-center justify-center rounded-full',
                                    isActive ? 'bg-primary/20' : 'bg-primary/10',
                                )}
                            >
                                <Wallet className="size-3.5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {connectorLabel(wallet.connectorId)}
                                </div>
                                <div className="truncate font-mono text-xs text-foreground" title={address}>
                                    {truncateAddress(address)}
                                </div>
                            </div>
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    void handleCopy(walletId, address);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        void handleCopy(walletId, address);
                                    }
                                }}
                                title="Copy address"
                                aria-label="Copy address"
                                className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                            >
                                {isCopied ? (
                                    <Check className="size-3.5 text-green-500" />
                                ) : (
                                    <Copy className="size-3.5" />
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
                {distinctConnectorIds.map((connectorId) => (
                    <button
                        key={connectorId}
                        type="button"
                        onClick={() => handleDisconnect(connectorId)}
                        disabled={isDisconnecting}
                        className="flex items-center gap-1.5 rounded-md border border-border bg-card/50 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
                    >
                        <LogOut className="size-3.5" />
                        <span>Disconnect {connectorLabel(connectorId)}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
