/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSelectedWallet, useConnectedWallets, useConnectors, useConnectorById } from '@ton/appkit-react';
import { PRIVY_DEFAULT_CONNECTOR_ID } from '@ton/appkit';
import type { PrivyConnector, PrivyConnectorDebugInfo } from '@ton/appkit';
import { Bug, ChevronDown, ChevronUp } from 'lucide-react';

function isInsideTelegram(): boolean {
    if (typeof window === 'undefined') return false;
    const initData = (window as Window & { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp?.initData;
    return typeof initData === 'string' && initData.length > 0;
}

const Row = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="flex items-start gap-2 py-0.5 text-xs">
        <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
        <span className="min-w-0 flex-1 break-all font-mono text-foreground">{value}</span>
    </div>
);

const Pill = ({ tone, children }: { tone: 'ok' | 'off' | 'warn'; children: ReactNode }) => {
    const toneClass =
        tone === 'ok'
            ? 'bg-green-500/15 text-green-500'
            : tone === 'warn'
              ? 'bg-amber-500/15 text-amber-500'
              : 'bg-muted/40 text-muted-foreground';
    return (
        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${toneClass}`}>
            {children}
        </span>
    );
};

export const PrivyDebugPanel = () => {
    const [open, setOpen] = useState(false);
    const { ready, authenticated, user } = usePrivy();
    const [selectedWallet] = useSelectedWallet();
    const connectedWallets = useConnectedWallets();
    const connectors = useConnectors();
    const privyConnector = useConnectorById(PRIVY_DEFAULT_CONNECTOR_ID) as PrivyConnector | undefined;

    const [debugInfo, setDebugInfo] = useState<PrivyConnectorDebugInfo | null>(null);
    useEffect(() => {
        if (!privyConnector) {
            setDebugInfo(null);
            return;
        }
        const tick = () => setDebugInfo(privyConnector.getDebugInfo());
        tick();
        const handle = window.setInterval(tick, 500);
        return () => window.clearInterval(handle);
    }, [privyConnector]);

    const insideTelegram = isInsideTelegram();
    const tonAccount = user?.linkedAccounts?.find(
        (a) => a.type === 'wallet' && 'chainType' in a && a.chainType === 'ton',
    );

    const statusTone: 'ok' | 'warn' | 'off' =
        debugInfo?.status === 'ready' ? 'ok' : debugInfo?.status === 'error' ? 'warn' : 'off';

    return (
        <div className="fixed bottom-3 right-3 z-50 w-[min(360px,calc(100vw-1.5rem))] rounded-lg border border-border bg-background/95 shadow-lg backdrop-blur">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-foreground"
            >
                <Bug className="size-3.5 text-primary" />
                <span>Privy debug</span>
                <span className="ml-auto flex items-center gap-1">
                    <Pill tone={ready ? 'ok' : 'off'}>{ready ? 'ready' : 'loading'}</Pill>
                    <Pill tone={authenticated ? 'ok' : 'off'}>{authenticated ? 'auth' : 'anon'}</Pill>
                    <Pill tone={statusTone}>{debugInfo?.status ?? 'no connector'}</Pill>
                    {open ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
                </span>
            </button>

            {open && (
                <div className="max-h-[60vh] overflow-auto border-t border-border px-3 py-2">
                    <div className="pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Privy
                    </div>
                    <Row label="ready" value={String(ready)} />
                    <Row label="authenticated" value={String(authenticated)} />
                    <Row label="inside Telegram" value={String(insideTelegram)} />
                    <Row label="user.id" value={user?.id ?? '—'} />
                    <Row
                        label="linked accounts"
                        value={user?.linkedAccounts?.length ? user.linkedAccounts.map((a) => a.type).join(', ') : '—'}
                    />
                    <Row
                        label="ton account"
                        value={
                            tonAccount && 'address' in tonAccount
                                ? `${tonAccount.address}${'id' in tonAccount && tonAccount.id ? ` (${tonAccount.id})` : ''}`
                                : '—'
                        }
                    />

                    <div className="pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        PrivyConnector
                    </div>
                    <Row label="found" value={String(Boolean(privyConnector))} />
                    <Row label="status" value={debugInfo?.status ?? '—'} />
                    <Row
                        label="error"
                        value={debugInfo?.error ? <span className="text-red-500">{debugInfo.error}</span> : '—'}
                    />
                    <Row label="has latest state" value={String(debugInfo?.hasLatestState ?? false)} />
                    <Row label="has ton wallet" value={String(debugInfo?.hasTonWallet ?? false)} />
                    <Row label="last walletId" value={debugInfo?.lastWalletId ?? '—'} />

                    <div className="pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        AppKit
                    </div>
                    <Row
                        label="connectors"
                        value={connectors.length ? connectors.map((c) => `${c.id}:${c.type}`).join(', ') : '—'}
                    />
                    <Row label="connected wallets" value={String(connectedWallets.length)} />
                    <Row label="selected.id" value={selectedWallet?.getWalletId() ?? '—'} />
                    <Row label="selected.connector" value={selectedWallet?.connectorId ?? '—'} />
                    <Row label="selected.address" value={selectedWallet?.getAddress() ?? '—'} />
                    <Row
                        label="selected.network"
                        value={selectedWallet ? String(selectedWallet.getNetwork().chainId) : '—'}
                    />
                    <Row label="selected.pubkey" value={selectedWallet?.getPublicKey() ?? '—'} />
                </div>
            )}
        </div>
    );
};
