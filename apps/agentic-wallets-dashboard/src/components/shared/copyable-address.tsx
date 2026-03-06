/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyableAddress({ address, truncate = true }: { address: string; truncate?: boolean }) {
    const [copied, setCopied] = useState(false);

    const display = truncate ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(address);
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
