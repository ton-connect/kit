/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type React from 'react';
import { Sparkles, Coins, AlertCircle } from 'lucide-react';
import { useSelectedWallet, Transaction } from '@ton/appkit-ui-react';
import { getErrorMessage } from '@ton/appkit';
import { toast } from 'sonner';

import { CardPreview } from './card-preview';
import { useCardGenerator } from '../hooks/use-card-generator';
import { useMintTransaction } from '../hooks/use-mint';
import { useMinterStore } from '../store/minter-store';

import { Button, Card } from '@/core/components';

interface CardGeneratorProps {
    className?: string;
}

export const CardGenerator: React.FC<CardGeneratorProps> = ({ className }) => {
    const { currentCard, isGenerating, generate } = useCardGenerator();
    const { createMintTransaction, canMint } = useMintTransaction();
    const { mintCard } = useMinterStore();
    const [wallet] = useSelectedWallet();
    const [mintError, setMintError] = useState<string | null>(null);
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
                        <div className="w-48 rounded-2xl border-2 border-dashed border-border bg-muted/50 p-4">
                            <div className="aspect-[3/4] rounded-xl flex items-center justify-center bg-background/50 mb-4">
                                <div className="text-center">
                                    <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-muted-foreground text-xs">Your card will appear here</p>
                                </div>
                            </div>
                            <div className="h-14" />
                        </div>
                    )}
                </div>

                {/* Rarity odds info */}
                <div className="bg-muted/50 rounded-lg p-2">
                    <div className="grid grid-cols-4 gap-1 text-center text-xs">
                        <div className="flex items-center justify-center gap-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                            <span className="text-muted-foreground">60%</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="text-muted-foreground">25%</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                            <span className="text-muted-foreground">12%</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                            <div className="w-2 h-2 bg-amber-500 rounded-full" />
                            <span className="text-muted-foreground">3%</span>
                        </div>
                    </div>
                </div>

                {/* Mint error */}
                {mintError && (
                    <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                        <p className="text-xs text-destructive">{mintError}</p>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                    <Button onClick={generate} isLoading={isGenerating} className="flex-1">
                        <Sparkles className="w-4 h-4 mr-2" />
                        {currentCard ? 'New' : 'Generate'}
                    </Button>

                    {isConnected && (
                        <Transaction
                            getTransactionRequest={createMintTransaction}
                            onSuccess={() => {
                                mintCard();
                                setMintError(null);
                                toast.success('NFT minted successfully!');
                            }}
                            onError={(error) => {
                                setMintError(getErrorMessage(error));
                            }}
                            disabled={!canMint}
                        >
                            {({ isLoading, onSubmit, disabled }) => (
                                <Button
                                    onClick={onSubmit}
                                    disabled={disabled}
                                    isLoading={isLoading}
                                    variant="secondary"
                                    className="flex-1"
                                >
                                    <Coins className="w-4 h-4 mr-2" />
                                    Mint
                                </Button>
                            )}
                        </Transaction>
                    )}
                </div>
            </div>
        </Card>
    );
};
