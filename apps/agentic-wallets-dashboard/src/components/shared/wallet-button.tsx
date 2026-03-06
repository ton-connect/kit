/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState, useRef, useEffect } from 'react';
import { useAddress, useConnect, useDisconnect, useNetwork, TONCONNECT_DEFAULT_CONNECTOR_ID } from '@ton/appkit-react';

import { formatTonAddressForNetwork } from '@/features/agents/lib/address';

function formatAddress(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletButton() {
    const address = useAddress();
    const network = useNetwork();
    const { mutate: connect } = useConnect();
    const { mutate: disconnect } = useDisconnect();
    const [menuOpen, setMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!address) {
        return (
            <button
                onClick={() => connect({ connectorId: TONCONNECT_DEFAULT_CONNECTOR_ID })}
                className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-amber-400 sm:px-4 sm:text-sm"
            >
                <span className="sm:hidden">Connect</span>
                <span className="hidden sm:inline">Connect Wallet</span>
            </button>
        );
    }

    const formattedAddress = formatTonAddressForNetwork(address, network?.chainId);

    const handleCopyAddress = async () => {
        await navigator.clipboard.writeText(formattedAddress);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-sm font-medium transition-colors hover:bg-white/[0.08] sm:gap-2 sm:px-3"
            >
                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
                <span className="font-mono text-[11px] sm:text-xs">{formatAddress(formattedAddress)}</span>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                >
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </button>

            {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-lg border border-white/10 bg-[#111] shadow-xl animate-fade-in">
                    <div className="border-b border-white/[0.06] px-4 py-3">
                        <p className="text-[10px] uppercase tracking-widest text-neutral-500">Connected</p>
                        <p className="mt-1 font-mono text-xs text-white/70">{formatAddress(formattedAddress)}</p>
                    </div>
                    <button
                        onClick={handleCopyAddress}
                        className="flex w-full items-center gap-2 border-b border-white/[0.06] px-4 py-3 text-left text-sm text-neutral-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                                d="M5.25 5.25V2.917C5.25 2.27267 5.77267 1.75 6.417 1.75H11.083C11.7273 1.75 12.25 2.27267 12.25 2.917V7.583C12.25 8.22733 11.7273 8.75 11.083 8.75H8.75M5.25 5.25H2.917C2.27267 5.25 1.75 5.77267 1.75 6.417V11.083C1.75 11.7273 2.27267 12.25 2.917 12.25H7.583C8.22733 12.25 8.75 11.7273 8.75 11.083V8.75M5.25 5.25H8.75V8.75"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        {copied ? 'Copied' : 'Copy address'}
                    </button>
                    <button
                        onClick={() => {
                            disconnect({ connectorId: TONCONNECT_DEFAULT_CONNECTOR_ID });
                            setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-400 transition-colors hover:bg-white/[0.04]"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                                d="M5.25 12.25H2.917A1.167 1.167 0 011.75 11.083V2.917A1.167 1.167 0 012.917 1.75H5.25M9.333 9.917L12.25 7l-2.917-2.917M12.25 7H5.25"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        Disconnect
                    </button>
                </div>
            )}
        </div>
    );
}
