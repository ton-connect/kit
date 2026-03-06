/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function EmptyIllustration() {
    return (
        <svg viewBox="0 0 240 160" fill="none" className="mx-auto h-auto w-full max-w-[200px]" aria-hidden="true">
            <rect x="70" y="20" width="100" height="48" rx="12" stroke="white" strokeWidth="1" strokeOpacity="0.35" />
            <text
                x="120"
                y="42"
                textAnchor="middle"
                fill="white"
                fontSize="9"
                fontWeight="600"
                fontFamily="system-ui"
                opacity="0.6"
            >
                Your Wallet
            </text>
            <text x="120" y="56" textAnchor="middle" fill="#f59e0b" fontSize="7" fontFamily="monospace" opacity="0.7">
                connected
            </text>

            <path d="M120 68 L120 90" stroke="white" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="3 3" />

            <rect
                x="70"
                y="90"
                width="100"
                height="48"
                rx="12"
                stroke="white"
                strokeWidth="1"
                strokeOpacity="0.15"
                strokeDasharray="6 4"
            />
            <text x="120" y="118" textAnchor="middle" fill="white" fontSize="8" fontFamily="system-ui" opacity="0.3">
                No agents yet
            </text>

            <circle cx="120" cy="80" r="3" fill="white" fillOpacity="0.15">
                <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
                <animate attributeName="fillOpacity" values="0.15;0.3;0.15" dur="2s" repeatCount="indefinite" />
            </circle>
        </svg>
    );
}

export function EmptyState() {
    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 animate-fade-in">
            <EmptyIllustration />
            <div className="text-center">
                <h2 className="text-xl font-semibold tracking-tight">No agents connected</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-400">
                    Agent wallets from the configured SBT collection will appear here automatically. You can also use
                    the Create flow to deploy and fund a new agent wallet.
                </p>
            </div>
        </div>
    );
}
