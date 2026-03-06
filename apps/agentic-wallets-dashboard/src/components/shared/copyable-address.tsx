/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNetwork } from '@ton/appkit-react';
import { Copy, Check } from 'lucide-react';

import { formatTonAddressForNetwork } from '@/features/agents/lib/address';

interface CopyableValueProps {
    value: string;
    copyValue?: string;
    truncate?: boolean;
    className?: string;
    adaptive?: boolean;
}

function truncateMiddle(value: string, visibleChars: number): string {
    if (value.length <= visibleChars + 3) {
        return value;
    }

    const prefixChars = Math.ceil(visibleChars / 2);
    const suffixChars = Math.floor(visibleChars / 2);
    return `${value.slice(0, prefixChars)}...${value.slice(-suffixChars)}`;
}

function CopyableValueBase({ value, copyValue, truncate = true, className, adaptive = false }: CopyableValueProps) {
    const [copied, setCopied] = useState(false);
    const staticDisplay = truncate ? truncateMiddle(value, 10) : value;
    const [displayValue, setDisplayValue] = useState(adaptive ? value : staticDisplay);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);

    const recalculateDisplay = useCallback(() => {
        if (!adaptive) {
            setDisplayValue(truncate ? truncateMiddle(value, 10) : value);
            return;
        }

        if (!truncate) {
            setDisplayValue(value);
            return;
        }

        const button = buttonRef.current;
        const measure = measureRef.current;
        if (!button || !measure) {
            setDisplayValue(value);
            return;
        }

        const style = window.getComputedStyle(button);
        const gap = Number.parseFloat(style.gap || '0') || 0;
        const iconWidth = 12;
        const sideSlack = 4;
        const container = button.parentElement as HTMLElement | null;
        const containerWidth = container?.clientWidth ?? button.clientWidth;
        const availableWidth = containerWidth - iconWidth - gap - sideSlack;

        const measureTextWidth = (text: string): number => {
            measure.textContent = text;
            return measure.getBoundingClientRect().width;
        };

        if (availableWidth <= 0 || measureTextWidth(value) <= availableWidth) {
            setDisplayValue(value);
            return;
        }

        let low = 2;
        let high = Math.max(2, value.length - 3);
        let best = 2;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const candidate = truncateMiddle(value, mid);

            if (measureTextWidth(candidate) <= availableWidth) {
                best = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        setDisplayValue(truncateMiddle(value, best));
    }, [adaptive, truncate, value]);

    useEffect(() => {
        recalculateDisplay();

        if (!adaptive) {
            return;
        }

        const button = buttonRef.current;
        if (!button) return;

        const observed = (button.parentElement as HTMLElement | null) ?? button;
        const observer = new ResizeObserver(() => {
            recalculateDisplay();
        });
        observer.observe(observed);

        const onResize = () => {
            recalculateDisplay();
        };
        window.addEventListener('resize', onResize);

        let isDisposed = false;
        if (document.fonts?.ready) {
            void document.fonts.ready.then(() => {
                if (!isDisposed) {
                    recalculateDisplay();
                }
            });
        }

        return () => {
            isDisposed = true;
            observer.disconnect();
            window.removeEventListener('resize', onResize);
        };
    }, [adaptive, recalculateDisplay]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(copyValue ?? value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            ref={buttonRef}
            onClick={handleCopy}
            className={`relative inline-flex w-full min-w-0 max-w-full items-center gap-1.5 font-mono text-xs text-neutral-500 transition-colors hover:text-neutral-300 ${className ?? ''}`}
        >
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {adaptive ? displayValue : staticDisplay}
            </span>
            {copied ? <Check size={12} className="shrink-0 text-emerald-500" /> : <Copy size={12} className="shrink-0" />}
            <span
                ref={measureRef}
                className="pointer-events-none absolute -z-10 whitespace-nowrap font-mono text-xs opacity-0"
                aria-hidden="true"
            />
        </button>
    );
}

export function CopyableValue(props: CopyableValueProps) {
    return <CopyableValueBase {...props} />;
}

export function CopyableAddress({
    address,
    truncate = true,
    className,
    adaptive,
}: {
    address: string;
    truncate?: boolean;
    className?: string;
    adaptive?: boolean;
}) {
    const network = useNetwork();
    const formattedAddress = formatTonAddressForNetwork(address, network?.chainId);

    return (
        <CopyableValueBase
            value={formattedAddress}
            copyValue={formattedAddress}
            truncate={truncate}
            className={className}
            adaptive={adaptive}
        />
    );
}
