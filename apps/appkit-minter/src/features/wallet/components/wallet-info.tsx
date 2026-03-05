/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState, useCallback } from 'react';
import type { ComponentProps, FC } from 'react';
import { useSelectedWallet, Network } from '@ton/appkit-react';
import { Wallet, Check, Copy } from 'lucide-react';

import { Card } from '@/core/components';

const NETWORK_LABELS: Record<string, string> = {
    [Network.mainnet().chainId]: 'Mainnet',
    [Network.testnet().chainId]: 'Testnet',
    [Network.tetra().chainId]: 'Tetra',
};

const getNetworkLabel = (chainId: string): string => {
    return NETWORK_LABELS[chainId] ?? `Chain ${chainId}`;
};

const truncateAddress = (address: string): string => {
    if (address.length <= 12) {
        return address;
    }

    return `${address.slice(0, 6)}…${address.slice(-6)}`;
};

export const WalletInfo: FC<ComponentProps<'div'>> = (props) => {
    const [wallet] = useSelectedWallet();
    const [copied, setCopied] = useState(false);

    const address = wallet?.getAddress() ?? '';
    const networkLabel = wallet ? getNetworkLabel(wallet.getNetwork().chainId) : '';

    const handleCopy = useCallback(async () => {
        if (!address) return;
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [address]);

    return (
        <Card {...props}>
            <div className="flex items-center justify-between gap-4 py-1">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-5 h-5 text-primary" />
                    </div>

                    {!wallet && <p className="text-muted-foreground text-sm">Connect wallet to mint</p>}

                    {wallet && (
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate" title={address}>
                                {truncateAddress(address)}
                            </p>

                            <p className="text-xs text-muted-foreground">Network: {networkLabel}</p>
                        </div>
                    )}
                </div>

                {wallet && (
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors flex-shrink-0"
                        title="Copy address"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-green-500" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy Address
                            </>
                        )}
                    </button>
                )}
            </div>
        </Card>
    );
};
