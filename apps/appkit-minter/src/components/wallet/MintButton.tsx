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
                <div className="text-center py-4">
                    <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">Connect your wallet to mint NFTs</p>
                    <p className="text-sm text-gray-500">Your minted cards will be sent to your wallet</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <div className="space-y-4">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Mint Your Card</h3>
                    <p className="text-gray-600 text-sm">
                        {canMint
                            ? 'Like this card? Mint it to your wallet!'
                            : 'Generate a card first, then mint it to your collection.'}
                    </p>
                </div>

                {mintError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{mintError}</p>
                    </div>
                )}

                <Button onClick={mint} disabled={!canMint} isLoading={isMinting} className="w-full" size="lg">
                    <Coins className="w-5 h-5 mr-2" />
                    {isMinting ? 'Minting...' : 'Mint NFT'}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                    A small transaction fee (~0.01 TON) will be charged for minting.
                </p>
            </div>
        </Card>
    );
};
