/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

import { CardPreview } from './CardPreview';

import { Button } from '@/components/common';
import { Card } from '@/components/common';
import { useCardGenerator } from '@/hooks';

interface CardGeneratorProps {
    className?: string;
}

export const CardGenerator: React.FC<CardGeneratorProps> = ({ className }) => {
    const { currentCard, isGenerating, generate, clear } = useCardGenerator();

    return (
        <Card className={className}>
            <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate Your NFT Card</h2>
                    <p className="text-gray-600">
                        Click the button below to randomly generate a unique NFT card with varying rarities.
                    </p>
                </div>

                {/* Card preview area */}
                <div className="flex justify-center">
                    {currentCard ? (
                        <div className="w-64">
                            <CardPreview card={currentCard} />
                        </div>
                    ) : (
                        <div className="w-64 aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                            <div className="text-center p-4">
                                <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">Your card will appear here</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Rarity odds info */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center">Rarity Odds</h4>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div>
                            <div className="w-3 h-3 bg-gray-400 rounded-full mx-auto mb-1" />
                            <span className="text-gray-600">Common</span>
                            <div className="font-semibold text-gray-900">60%</div>
                        </div>
                        <div>
                            <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-1" />
                            <span className="text-gray-600">Rare</span>
                            <div className="font-semibold text-gray-900">25%</div>
                        </div>
                        <div>
                            <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto mb-1" />
                            <span className="text-gray-600">Epic</span>
                            <div className="font-semibold text-gray-900">12%</div>
                        </div>
                        <div>
                            <div className="w-3 h-3 bg-amber-500 rounded-full mx-auto mb-1" />
                            <span className="text-gray-600">Legendary</span>
                            <div className="font-semibold text-gray-900">3%</div>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                    <Button onClick={generate} isLoading={isGenerating} className="flex-1" size="lg">
                        <Sparkles className="w-5 h-5 mr-2" />
                        {currentCard ? 'Generate New' : 'Generate Card'}
                    </Button>

                    {currentCard && (
                        <Button onClick={clear} variant="secondary" size="lg">
                            <RefreshCw className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
};
