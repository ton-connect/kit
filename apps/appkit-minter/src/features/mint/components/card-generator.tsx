/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type React from 'react';
import { AlertCircle, Coins, Sparkles } from 'lucide-react';
import { Button, Send, useSelectedWallet } from '@ton/appkit-react';
import { getErrorMessage } from '@ton/appkit';
import { toast } from 'sonner';

import { CardPreview } from './card-preview';
import { useCardGenerator } from '../hooks/use-card-generator';
import { useNftMintTransaction } from '../hooks/use-nft-mint-transaction';
import { mintCard } from '../store/actions/mint-card';
import { setMintError } from '../store/actions/set-mint-error';

import { cn } from '@/core/lib/utils';

const RARITY_ODDS: { label: string; chance: number; color: string }[] = [
    { label: 'Common', chance: 60, color: 'bg-tertiary-foreground' },
    { label: 'Rare', chance: 25, color: 'bg-blue-500' },
    { label: 'Epic', chance: 12, color: 'bg-purple-500' },
    { label: 'Legendary', chance: 3, color: 'bg-amber-500' },
];

interface CardGeneratorProps {
    className?: string;
}

export const CardGenerator: React.FC<CardGeneratorProps> = ({ className }) => {
    const { currentCard, isGenerating, generate } = useCardGenerator();
    const { createMintTransaction, canMint } = useNftMintTransaction();
    const [wallet] = useSelectedWallet();
    const [mintErrorLocal, setMintErrorLocal] = useState<string | null>(null);
    const isConnected = !!wallet;

    return (
        <div className={cn('mx-auto flex w-full max-w-[434px] flex-col gap-4', className)}>
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Mint NFT</h2>
            </div>

            <div className="flex justify-center rounded-2xl bg-secondary p-6">
                {currentCard ? (
                    <div className="w-56">
                        <CardPreview card={currentCard} />
                    </div>
                ) : (
                    <div className="flex aspect-[3/4] w-56 flex-col items-center justify-center rounded-xl border-2 border-dashed border-tertiary bg-background/40 px-4">
                        <Sparkles className="mb-2 h-10 w-10 text-tertiary-foreground" />
                        <p className="text-center text-xs text-tertiary-foreground">Your card will appear here</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-4 gap-1 rounded-xl bg-secondary px-3 py-2 text-xs">
                {RARITY_ODDS.map(({ label, chance, color }) => (
                    <div key={label} className="flex items-center justify-center gap-1.5">
                        <span className={cn('h-2 w-2 rounded-full', color)} />
                        <span className="text-tertiary-foreground">{chance}%</span>
                    </div>
                ))}
            </div>

            {mintErrorLocal && (
                <div className="flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 p-3">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 text-error" />
                    <p className="text-xs text-error">{mintErrorLocal}</p>
                </div>
            )}

            <div className="flex flex-col gap-2">
                <Button
                    size="l"
                    variant={currentCard ? 'bezeled' : 'fill'}
                    onClick={generate}
                    loading={isGenerating}
                    fullWidth
                    icon={<Sparkles className="h-4 w-4" />}
                >
                    {currentCard ? 'Generate new card' : 'Generate card'}
                </Button>

                {isConnected && canMint && (
                    <Send
                        request={createMintTransaction}
                        onSuccess={() => {
                            mintCard();
                            setMintErrorLocal(null);
                            setMintError(null);
                            toast.success('NFT minted successfully!');
                        }}
                        onError={(error: Error) => {
                            const msg = getErrorMessage(error);
                            setMintErrorLocal(msg);
                            setMintError(msg);
                        }}
                        disabled={!canMint}
                    >
                        {({ isLoading, onSubmit, disabled }) => (
                            <Button
                                size="l"
                                onClick={onSubmit}
                                disabled={disabled}
                                loading={isLoading}
                                fullWidth
                                icon={<Coins className="h-4 w-4" />}
                            >
                                Mint NFT
                            </Button>
                        )}
                    </Send>
                )}
            </div>
        </div>
    );
};
