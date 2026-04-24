/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from 'react';
import { TonConnectButton, useSelectedWallet, useDisconnect } from '@ton/appkit-react';
import { Wallet, Check, Copy, LogOut } from 'lucide-react';

import { truncateAddress } from '@/core/utils/truncate-address';

export const HeaderWallet = () => {
    const [wallet] = useSelectedWallet();
    const { mutate: disconnect, isPending: isDisconnecting } = useDisconnect();
    const [copied, setCopied] = useState(false);

    const address = wallet?.getAddress() ?? '';
    const connectorId = wallet?.connectorId ?? '';

    const handleCopy = useCallback(async () => {
        if (!address) return;
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [address]);

    const handleDisconnect = useCallback(() => {
        if (!connectorId) return;
        disconnect({ connectorId });
    }, [connectorId, disconnect]);

    return (
        <div className="ml-auto flex items-center gap-2">
            {wallet && (
                <div className="flex items-center gap-1.5 rounded-md border border-border bg-card/50 px-2 py-1">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Wallet className="size-3 text-primary" />
                    </div>
                    <span className="font-mono text-xs text-foreground" title={address}>
                        {truncateAddress(address)}
                    </span>
                    <button
                        type="button"
                        onClick={handleCopy}
                        title="Copy address"
                        aria-label="Copy address"
                        className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                    >
                        {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                    </button>
                    <button
                        type="button"
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                        title="Disconnect"
                        aria-label="Disconnect"
                        className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
                    >
                        <LogOut className="size-3.5" />
                    </button>
                </div>
            )}
            <TonConnectButton />
        </div>
    );
};
