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

import { Card } from '@/core/components';

const NETWORK_LABELS: Record<string, string> = {
    [Network.mainnet().chainId]: 'Mainnet',
    [Network.testnet().chainId]: 'Testnet',
    [Network.tetra().chainId]: 'Tetra',
};

function getNetworkLabel(chainId: string): string {
    return NETWORK_LABELS[chainId] ?? `Chain ${chainId}`;
}

function truncateAddress(address: string): string {
    if (address.length <= 12) {
        return address;
    }
    return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

export const WalletInfo: FC<ComponentProps<'div'>> = ({ className }) => {
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

    if (!wallet) {
        return null;
    }

    return (
        <Card className={className}>
            <div className="flex items-center justify-between gap-4 py-1">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate" title={address}>
                            {truncateAddress(address)}
                        </p>
                        <p className="text-xs text-muted-foreground">Network: {networkLabel}</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors flex-shrink-0"
                    title="Copy address"
                >
                    {copied ? (
                        <>
                            <svg
                                className="w-3.5 h-3.5 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied
                        </>
                    ) : (
                        <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                            </svg>
                            Copy Address
                        </>
                    )}
                </button>
            </div>
        </Card>
    );
};
