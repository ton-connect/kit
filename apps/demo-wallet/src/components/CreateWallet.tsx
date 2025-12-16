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
import { NetworkSelector } from './NetworkSelector';

interface CreateWalletProps {
    onConfirm: (mnemonic: string[], network: 'mainnet' | 'testnet') => Promise<void>;
    isLoading: boolean;
    error: string;
}

const MnemonicSkeleton: React.FC = () => {
    return (
        <div className="space-y-3">
            {/* Warning skeleton */}
            <div className="bg-yellow-50 border-yellow-200 rounded-md p-3">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="ml-2">
                        <p className="text-xs text-yellow-800">Keep this phrase safe and secret.</p>
                    </div>
                </div>
            </div>

            {/* Mnemonic Grid skeleton */}
            <div className="grid grid-cols-4 gap-1">
                {Array(24)
                    .fill(0)
                    .map((_, index) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 rounded p-1 text-center">
                            <span className="text-gray-400 text-[10px]">{index + 1}.</span>
                            <div className="text-[10px] text-gray-300 animate-pulse">····</div>
                        </div>
                    ))}
            </div>

            {/* Copy Button skeleton */}
            <div className="flex justify-center">
                <button
                    disabled
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 text-gray-400 rounded text-xs border border-gray-300 cursor-not-allowed"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                    <span>Copy</span>
                </button>
            </div>
        </div>
    );
};

const MnemonicGrid: React.FC<{ mnemonic: string[] }> = ({ mnemonic }) => {
    const [copyFeedback, setCopyFeedback] = useState('');

    const handleCopyMnemonic = async () => {
        try {
            const mnemonicString = mnemonic.join(' ');
            await navigator.clipboard.writeText(mnemonicString);
            setCopyFeedback('Copied!');
            setTimeout(() => setCopyFeedback(''), 2000);
        } catch (_) {
            setCopyFeedback('Failed');
            setTimeout(() => setCopyFeedback(''), 2000);
        }
    };

    return (
        <div className="space-y-3">
            {/* Warning */}
            <div className="bg-yellow-50 border-yellow-200 rounded-md p-3">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="ml-2">
                        <p className="text-xs text-yellow-800">Keep this phrase safe and secret.</p>
                    </div>
                </div>
            </div>

            {/* Mnemonic Grid */}
            <div className="grid grid-cols-4 gap-1">
                {mnemonic.map((word, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded p-1 text-center">
                        <span className="text-gray-400 text-[10px]">{index + 1}.</span>
                        <div className="font-medium text-[10px] text-gray-900 truncate">{word}</div>
                    </div>
                ))}
            </div>

            {/* Copy Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleCopyMnemonic}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs border border-gray-300 transition-colors"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                    <span>{copyFeedback || 'Copy'}</span>
                </button>
            </div>
        </div>
    );
};

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
                                <Button onClick={() => setShowMnemonic(true)} size="sm">
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
                                    checked={isSaved}
                                    onChange={(e) => setIsSaved(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-xs text-gray-700">I have saved my recovery phrase</span>
                            </label>

                            <Button
                                onClick={handleConfirm}
                                disabled={!isSaved || isLoading}
                                isLoading={isLoading}
                                className="w-full"
                            >
                                Import Wallet
                            </Button>
                        </div>
                    )}

                    <Button variant="secondary" onClick={generateMnemonic} disabled={isGenerating} className="w-full">
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
