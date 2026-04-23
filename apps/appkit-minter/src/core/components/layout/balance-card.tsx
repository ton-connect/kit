/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from 'react';
import type { FC } from 'react';
import { Network, useBalance, useDefaultNetwork, useSelectedWallet } from '@ton/appkit-react';
import { Check, Copy, ExternalLink, Wallet } from 'lucide-react';

const TESTNET_CHAIN_ID = Network.testnet().chainId;

const formatTon = (nano: string | null | undefined): string => {
    if (!nano) return '0';
    let value: bigint;
    try {
        value = BigInt(nano);
    } catch {
        return '0';
    }
    const whole = value / 1_000_000_000n;
    const frac = value % 1_000_000_000n;
    const fracStr = frac.toString().padStart(9, '0').slice(0, 4).replace(/0+$/, '');
    return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
};

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
    const [wallet] = useSelectedWallet();
    const [defaultNetwork] = useDefaultNetwork();
    const [copied, setCopied] = useState(false);

    const address = wallet?.getAddress() ?? '';

    const { data: balance, isLoading } = useBalance({
        query: { refetchInterval: 20000, enabled: !!wallet },
    });

    const handleCopy = useCallback(async () => {
        if (!address) return;
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [address]);

    if (!wallet) {
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
        <div className="mb-2">
            <p className="text-xs font-medium uppercase tracking-wider text-tertiary-foreground">TON Balance</p>
            <p className="mt-1 flex items-baseline gap-1.5">
                {isLoading ? (
                    <span className="inline-block h-8 w-28 animate-pulse rounded bg-tertiary" />
                ) : (
                    <span className="text-3xl font-bold text-foreground">{formatTon(balance)}</span>
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
