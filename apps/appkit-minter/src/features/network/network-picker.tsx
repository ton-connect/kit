/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ChangeEvent } from 'react';
import { useDefaultNetwork, useNetworks, useSelectedWallet, Network } from '@ton/appkit-react';

const NETWORK_LABELS: Record<string, string> = {
    [Network.mainnet().chainId]: 'Mainnet',
    [Network.testnet().chainId]: 'Testnet',
};

function getNetworkLabel(chainId: string): string {
    return NETWORK_LABELS[chainId] ?? `Chain ${chainId}`;
}

export const NetworkPicker: FC = () => {
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

    return (
        <select
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            value={defaultNetwork?.chainId ?? ''}
            onChange={handleChange}
            disabled={!!wallet}
        >
            <option value="">Any Network</option>
            {networks.map((network) => (
                <option key={network.chainId} value={network.chainId}>
                    {getNetworkLabel(network.chainId)}
                </option>
            ))}
        </select>
    );
};
