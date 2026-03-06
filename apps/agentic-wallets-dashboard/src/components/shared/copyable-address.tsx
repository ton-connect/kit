/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { useNetwork } from '@ton/appkit-react';
import { Copy, Check } from 'lucide-react';

import { formatTonAddressForNetwork } from '@/features/agents/lib/address';

export function CopyableAddress({ address, truncate = true }: { address: string; truncate?: boolean }) {
    const [copied, setCopied] = useState(false);
    const network = useNetwork();
    const formattedAddress = formatTonAddressForNetwork(address, network?.chainId);

    const display = truncate ? `${formattedAddress.slice(0, 6)}...${formattedAddress.slice(-4)}` : formattedAddress;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(formattedAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 font-mono text-xs text-neutral-500 transition-colors hover:text-neutral-300"
        >
            {display}
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
        </button>
    );
}
