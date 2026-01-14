/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { Coins, AlertCircle, Wallet } from 'lucide-react';

import { Button, Card } from '@/components/common';
import { useMint, useAppKit } from '@/hooks';

interface MintButtonProps {
    className?: string;
}

export const MintButton: React.FC<MintButtonProps> = ({ className }) => {
    const { mint, isMinting, mintError, canMint } = useMint();
    const { isConnected } = useAppKit();

    if (!isConnected) {
        return (
            <Card className={className}>
                <div className="flex items-center gap-3 py-2">
                    <Wallet className="w-8 h-8 text-gray-400 flex-shrink-0" />
                    <p className="text-gray-600 text-sm">Connect your wallet to mint NFTs</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <div className="space-y-3">
                {mintError && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-xs text-red-700">{mintError}</p>
                    </div>
                )}

                <Button onClick={mint} disabled={!canMint} isLoading={isMinting} className="w-full">
                    <Coins className="w-4 h-4 mr-2" />
                    {isMinting ? 'Minting...' : canMint ? 'Mint NFT' : 'Generate a card first'}
                </Button>

                <p className="text-xs text-gray-500 text-center">Fee: ~0.01 TON</p>
            </div>
        </Card>
    );
};
