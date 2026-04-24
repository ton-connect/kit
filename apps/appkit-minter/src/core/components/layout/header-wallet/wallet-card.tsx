/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { Button, Logo, useConnectorById } from '@ton/appkit-react';
import type { WalletInterface } from '@ton/appkit';
import { PRIVY_DEFAULT_CONNECTOR_ID, TONCONNECT_DEFAULT_CONNECTOR_ID } from '@ton/appkit';
import { Check, Copy, LogOut } from 'lucide-react';

import { cn } from '@/core/lib/utils';
import { truncateAddress } from '@/core/utils/truncate-address';

const connectorLabel = (connectorId: string): string => {
    if (connectorId === TONCONNECT_DEFAULT_CONNECTOR_ID) return 'TonConnect';
    if (connectorId === PRIVY_DEFAULT_CONNECTOR_ID) return 'Privy';
    return connectorId;
};

export interface WalletCardProps {
    wallet: WalletInterface;
    isActive: boolean;
    selectable: boolean;
    isCopied: boolean;
    isDisconnecting?: boolean;
    onSelect: () => void;
    onCopy: () => void;
    onDisconnect: () => void;
}

export const WalletCard: FC<WalletCardProps> = ({
    wallet,
    isActive,
    selectable,
    isCopied,
    isDisconnecting,
    onSelect,
    onCopy,
    onDisconnect,
}) => {
    const address = wallet.getAddress();
    const label = connectorLabel(wallet.connectorId);
    const connector = useConnectorById(wallet.connectorId);
    const iconUrl = connector?.metadata.iconUrl;

    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded-md border p-2 transition-colors',
                isActive ? 'border-primary/60' : 'border-transparent',
            )}
        >
            <button
                type="button"
                onClick={onSelect}
                disabled={!selectable}
                className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-default"
                aria-pressed={isActive}
            >
                <Logo size={32} src={iconUrl} alt={label} fallback={label[0]} />
                <div className="min-w-0 flex-1">
                    <div className="truncate text-[10px] font-medium uppercase tracking-wide text-tertiary-foreground">
                        {label}
                    </div>
                    <div className="truncate font-mono text-xs text-foreground" title={address}>
                        {truncateAddress(address)}
                    </div>
                </div>
            </button>
            <Button variant="ghost" size="icon" onClick={onCopy} title="Copy address" aria-label="Copy address">
                {isCopied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={onDisconnect}
                disabled={isDisconnecting}
                title="Disconnect"
                aria-label="Disconnect"
            >
                <LogOut className="size-3.5" />
            </Button>
        </div>
    );
};
