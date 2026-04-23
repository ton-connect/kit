/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState, useCallback } from 'react';
import type { ComponentProps, FC } from 'react';
import { useSelectedWallet } from '@ton/appkit-react';
import { Wallet, Check, Copy } from 'lucide-react';

import { cn } from '@/core/lib/utils';

const truncateAddress = (address: string): string => {
    if (address.length <= 12) {
        return address;
    }

    return `${address.slice(0, 4)}…${address.slice(-4)}`;
};

export const WalletInfo: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
    const [wallet] = useSelectedWallet();
    const [copied, setCopied] = useState(false);

    const address = wallet?.getAddress() ?? '';

    const handleCopy = useCallback(async () => {
        if (!address) return;
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [address]);

    if (!wallet) return null;

    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded-md border border-tertiary bg-secondary/50 p-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0',
                className,
            )}
            {...props}
        >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Wallet className="size-3.5 text-primary" />
            </div>

            <span
                className="min-w-0 flex-1 truncate font-mono text-xs text-foreground group-data-[collapsible=icon]:hidden"
                title={address}
            >
                {truncateAddress(address)}
            </span>

            <button
                type="button"
                onClick={handleCopy}
                title="Copy address"
                aria-label="Copy address"
                className="flex size-6 shrink-0 items-center justify-center rounded text-tertiary-foreground transition-colors hover:bg-tertiary/40 hover:text-foreground group-data-[collapsible=icon]:hidden"
            >
                {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
            </button>
        </div>
    );
};
