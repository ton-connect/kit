/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { WalletButton } from '@/components/shared/wallet-button';

function WalletIllustration() {
    return (
        <svg viewBox="0 0 280 200" fill="none" className="mx-auto h-auto w-full max-w-xs" aria-hidden="true">
            <rect x="90" y="40" width="100" height="56" rx="12" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
            <text
                x="140"
                y="64"
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="600"
                fontFamily="system-ui"
                opacity="0.7"
            >
                Your Wallet
            </text>
            <text x="140" y="80" textAnchor="middle" fill="white" fontSize="8" fontFamily="monospace" opacity="0.35">
                Connect to start
            </text>

            <path d="M110 96 C110 130 60 130 60 152" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
            <path d="M140 96 C140 120 140 135 140 152" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
            <path d="M170 96 C170 130 220 130 220 152" stroke="white" strokeWidth="1" strokeOpacity="0.2" />

            <circle r="2" fill="#f59e0b" opacity="0.8">
                <animateMotion dur="3s" repeatCount="indefinite" path="M140 96 C140 120 140 135 140 152" />
            </circle>
            <circle r="1.5" fill="white" opacity="0.4">
                <animateMotion dur="4s" repeatCount="indefinite" path="M110 96 C110 130 60 130 60 152" begin="1s" />
            </circle>
            <circle r="1.5" fill="white" opacity="0.4">
                <animateMotion dur="4s" repeatCount="indefinite" path="M170 96 C170 130 220 130 220 152" begin="2s" />
            </circle>

            {[60, 140, 220].map((x) => (
                <g key={x}>
                    <rect
                        x={x - 30}
                        y="152"
                        width="60"
                        height="32"
                        rx="8"
                        stroke="white"
                        strokeWidth="1"
                        strokeOpacity="0.2"
                        strokeDasharray="4 4"
                    />
                    <text
                        x={x}
                        y="172"
                        textAnchor="middle"
                        fill="white"
                        fontSize="7"
                        fontFamily="monospace"
                        opacity="0.3"
                    >
                        agent
                    </text>
                </g>
            ))}
        </svg>
    );
}

export function ConnectPrompt() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 animate-fade-in">
            <WalletIllustration />
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">Connect your wallet</h2>
                <p className="mt-2 max-w-sm text-sm text-neutral-400">
                    Connect your TON wallet to see and manage agent wallets linked to your address.
                </p>
            </div>
            <WalletButton />
        </div>
    );
}
