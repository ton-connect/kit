/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState, useCallback, useEffect } from 'react';
import { CreateTonMnemonic } from '@ton/walletkit';

import { Button } from './Button';
import { MnemonicGrid } from './MnemonicGrid';
import { MnemonicSkeleton } from './MnemonicSkeleton';
import { NetworkSelector } from './NetworkSelector';

interface CreateWalletProps {
    onConfirm: (mnemonic: string[], network: 'mainnet' | 'testnet') => Promise<void>;
    isLoading: boolean;
    error: string;
}

export const CreateWallet: React.FC<CreateWalletProps> = ({ onConfirm, isLoading, error }) => {
    const [mnemonic, setMnemonic] = useState<string[]>([]);
    const [showMnemonic, setShowMnemonic] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [network, setNetwork] = useState<'mainnet' | 'testnet'>('mainnet');
    const [generationError, setGenerationError] = useState('');

    const generateMnemonic = useCallback(async () => {
        setIsGenerating(true);
        setGenerationError('');
        setShowMnemonic(false);
        setIsSaved(false);
        try {
            const newMnemonic = await CreateTonMnemonic();
            setMnemonic(newMnemonic);
        } catch (err) {
            setGenerationError(err instanceof Error ? err.message : 'Failed to generate mnemonic');
        } finally {
            setIsGenerating(false);
        }
    }, []);

    // Generate mnemonic on mount
    useEffect(() => {
        generateMnemonic();
    }, [generateMnemonic]);

    const handleConfirm = async () => {
        await onConfirm(mnemonic, network);
    };

    return (
        <div className="space-y-4">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900" data-testid="subtitle">
                    Create New Wallet
                </h2>
                <p className="mt-1 text-xs text-gray-600">Write down these 24 words in order.</p>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                <div className="space-y-4">
                    <NetworkSelector value={network} onChange={setNetwork} compact />

                    <div className="relative">
                        <div className={!showMnemonic ? 'blur-sm' : ''}>
                            {isGenerating ? (
                                <MnemonicSkeleton />
                            ) : mnemonic.length > 0 ? (
                                <MnemonicGrid mnemonic={mnemonic} />
                            ) : (
                                <MnemonicSkeleton />
                            )}
                        </div>

                        {!showMnemonic && !isGenerating && mnemonic.length > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Button data-testid="reveal-mnemonic" onClick={() => setShowMnemonic(true)} size="sm">
                                    Click to reveal
                                </Button>
                            </div>
                        )}
                    </div>

                    {showMnemonic && mnemonic.length > 0 && (
                        <div className="space-y-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="saved"
                                    data-testid="saved-checkbox"
                                    checked={isSaved}
                                    onChange={(e) => setIsSaved(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-xs text-gray-700">I have saved my recovery phrase</span>
                            </label>

                            <Button
                                data-testid="create-wallet-confirm"
                                onClick={handleConfirm}
                                disabled={!isSaved || isLoading}
                                isLoading={isLoading}
                                className="w-full"
                            >
                                Import Wallet
                            </Button>
                        </div>
                    )}

                    <Button
                        data-testid="generate-new-phrase"
                        variant="secondary"
                        onClick={generateMnemonic}
                        disabled={isGenerating}
                        className="w-full"
                    >
                        Generate New Phrase
                    </Button>

                    {(generationError || error) && (
                        <div className="text-red-600 text-xs text-center">{generationError || error}</div>
                    )}
                </div>
            </div>
        </div>
    );
};
