/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { Sparkles, Coins, AlertCircle } from 'lucide-react';
import { useAppKit } from '@ton/appkit-ui-react';

import { CardPreview } from './CardPreview';

import { Button } from '@/components/common';
import { Card } from '@/components/common';
import { useCardGenerator, useMint } from '@/hooks';

interface CardGeneratorProps {
    className?: string;
}

export const CardGenerator: React.FC<CardGeneratorProps> = ({ className }) => {
    const { currentCard, isGenerating, generate } = useCardGenerator();
    const { mint, isMinting, mintError, canMint } = useMint();
    const { connectedWallets } = useAppKit();
    const wallet = connectedWallets[0] || null;
    const isConnected = !!wallet;

    return (
        <Card className={className}>
            <div className="space-y-4">
                {/* Card preview area */}
                <div className="flex justify-center">
                    {currentCard ? (
                        <div className="w-48">
                            <CardPreview card={currentCard} />
                        </div>
                    ) : (
                        <div className="w-48 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-4">
                            <div className="aspect-[3/4] rounded-xl flex items-center justify-center bg-white/50 mb-4">
                                <div className="text-center">
                                    <Sparkles className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500 text-xs">Your card will appear here</p>
                                </div>
                            </div>
                            <div className="h-14" />
                        </div>
                    )}
                </div>

                {/* Rarity odds info */}
                <div className="bg-gray-50 rounded-lg p-2">
                    <div className="grid grid-cols-4 gap-1 text-center text-xs">
                        <div className="flex items-center justify-center gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                            <span className="text-gray-600">60%</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="text-gray-600">25%</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                            <span className="text-gray-600">12%</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                            <div className="w-2 h-2 bg-amber-500 rounded-full" />
                            <span className="text-gray-600">3%</span>
                        </div>
                    </div>
                </div>

                {/* Mint error */}
                {mintError && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-xs text-red-700">{mintError}</p>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                    <Button onClick={generate} isLoading={isGenerating} className="flex-1">
                        <Sparkles className="w-4 h-4 mr-2" />
                        {currentCard ? 'New' : 'Generate'}
                    </Button>

                    {isConnected && (
                        <Button
                            onClick={mint}
                            disabled={!canMint}
                            isLoading={isMinting}
                            variant="secondary"
                            className="flex-1"
                        >
                            <Coins className="w-4 h-4 mr-2" />
                            Mint
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
};
