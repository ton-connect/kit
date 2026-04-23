/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from 'react';
import type { FC } from 'react';
import { formatLargeValue, Network, useAddress, useBalance, useDefaultNetwork } from '@ton/appkit-react';
import { Check, Copy, ExternalLink, Wallet } from 'lucide-react';

const TESTNET_CHAIN_ID = Network.testnet().chainId;

const truncateAddress = (address: string): string =>
    address.length <= 12 ? address : `${address.slice(0, 4)}…${address.slice(-4)}`;

const getExplorerUrls = (chainId: string | undefined, address: string) => {
    const isTestnet = chainId === TESTNET_CHAIN_ID;
    const tonscanHost = isTestnet ? 'testnet.tonscan.org' : 'tonscan.org';
    const tonviewerHost = isTestnet ? 'testnet.tonviewer.com' : 'tonviewer.com';
    return {
        tonscan: `https://${tonscanHost}/address/${address}`,
        tonviewer: `https://${tonviewerHost}/${address}`,
    };
};

export const BalanceCard: FC = () => {
    const [copied, setCopied] = useState(false);

    const address = useAddress();
    const [defaultNetwork] = useDefaultNetwork();

    const { data: balance, isLoading } = useBalance({ query: { refetchInterval: 15000 } });

    const handleCopy = useCallback(async () => {
        if (!address) return;
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [address]);

    if (!address) {
        return (
            <div className="mb-2 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <Wallet className="size-5 text-primary" />
                </div>
                <p className="text-sm text-tertiary-foreground">Connect your wallet to see your TON balance</p>
            </div>
        );
    }

    const explorers = getExplorerUrls(defaultNetwork?.chainId, address);

    return (
        <div className="mb-2 px-1">
            <p className="text-base font-semibold text-foreground">Balance</p>
            <p className="mt-1 flex items-baseline gap-1.5">
                {isLoading ? (
                    <span className="inline-block h-8 w-28 animate-pulse rounded bg-tertiary" />
                ) : (
                    <span className="text-3xl font-bold text-foreground">{formatLargeValue(balance || '0', 4)}</span>
                )}
                <span className="text-base font-medium text-tertiary-foreground">TON</span>
            </p>

            <div className="mt-3 flex items-center gap-1.5">
                <span className="truncate font-mono text-xs text-tertiary-foreground" title={address}>
                    {truncateAddress(address)}
                </span>
                <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copy address"
                    className="flex size-5 shrink-0 items-center justify-center rounded text-tertiary-foreground transition-colors hover:text-foreground"
                >
                    {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3" />}
                </button>
            </div>

            <div className="mt-2 flex items-center gap-3 text-xs">
                <a
                    href={explorers.tonscan}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-tertiary-foreground transition-colors hover:text-foreground"
                >
                    Tonscan
                    <ExternalLink className="size-3" />
                </a>
                <a
                    href={explorers.tonviewer}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-tertiary-foreground transition-colors hover:text-foreground"
                >
                    Tonviewer
                    <ExternalLink className="size-3" />
                </a>
            </div>
        </div>
    );
};
