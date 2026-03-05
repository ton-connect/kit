/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ComponentProps, ChangeEvent } from 'react';
import { useDefaultNetwork, useNetworks, useSelectedWallet, Network } from '@ton/appkit-react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/core/lib/utils';

const NETWORK_LABELS: Record<string, string> = {
    [Network.mainnet().chainId]: 'Mainnet',
    [Network.testnet().chainId]: 'Testnet',
    [Network.tetra().chainId]: 'Tetra',
};

const getNetworkLabel = (chainId: string): string => {
    return NETWORK_LABELS[chainId] ?? `Chain ${chainId}`;
};

export const NetworkPicker: FC<ComponentProps<'select'>> = ({ className, ...props }) => {
    const [defaultNetwork, setDefaultNetwork] = useDefaultNetwork();
    const networks = useNetworks();
    const [wallet] = useSelectedWallet();

    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;

        if (value === '') {
            setDefaultNetwork(undefined);
        } else {
            setDefaultNetwork(Network.custom(value));
        }
    };

    if (wallet) {
        return null;
    }

    return (
        <div className={cn('relative inline-block max-w-xs', className)}>
            <select
                className={cn(
                    'peer appearance-none w-full cursor-pointer rounded-4xl border border-border bg-card/60 px-4 py-2.5 pr-10 text-sm font-medium text-foreground outline-none backdrop-blur-md transition-all placeholder:text-muted-foreground hover:border-border hover:bg-card/80 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50',
                )}
                value={defaultNetwork?.chainId ?? ''}
                onChange={handleChange}
                disabled={!!wallet}
                {...props}
            >
                <option value="">Any Network</option>
                {networks.map((network) => (
                    <option key={network.chainId} value={network.chainId}>
                        {getNetworkLabel(network.chainId)}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-muted-foreground/70 transition-colors peer-focus:text-foreground">
                <ChevronDown className="h-4 w-4" />
            </div>
        </div>
    );
};
