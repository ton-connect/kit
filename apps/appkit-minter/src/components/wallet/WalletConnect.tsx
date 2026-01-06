/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';

import { Card } from '@/components/common';
import { useAppKit } from '@/hooks';

interface WalletConnectProps {
    className?: string;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ className }) => {
    const { isConnected, address } = useAppKit();

    if (isConnected && address) {
        return (
            <Card className={className}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Wallet Connected</h3>
                        <TonConnectButton />
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Address</p>
                        <p className="font-mono text-sm text-gray-900 break-all">{address}</p>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <div className="space-y-4">
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-600 text-sm mb-4">
                        Connect your TON wallet to mint NFT cards to your collection.
                    </p>

                    <div className="flex justify-center">
                        <TonConnectButton />
                    </div>
                </div>
            </div>
        </Card>
    );
};
