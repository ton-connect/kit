/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState, useRef, useEffect } from 'react';

import { Button } from './Button';
import { NetworkSelector } from './NetworkSelector';

interface ImportWalletProps {
    onImport: (
        mnemonic: string[],
        interfaceType: 'signer' | 'mnemonic',
        version?: 'v5r1' | 'v4r2',
        network?: 'mainnet' | 'testnet',
    ) => Promise<void>;
    onBack: () => void;
    isLoading: boolean;
    error: string;
}

export const ImportWallet: React.FC<ImportWalletProps> = ({ onImport, onBack, isLoading, error }) => {
    const [words, setWords] = useState<string[]>(Array(24).fill(''));
    const [activeInput, setActiveInput] = useState(0);
    const [interfaceType, setInterfaceType] = useState<'signer' | 'mnemonic'>('mnemonic');
    const [walletVersion, setWalletVersion] = useState<'v5r1' | 'v4r2'>('v5r1');
    const [network, setNetwork] = useState<'mainnet' | 'testnet'>('mainnet');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Initialize refs array
    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, 24);
    }, []);

    const handleWordChange = (index: number, value: string) => {
        const newWords = [...words];
        // Clean the input - only allow letters, convert to lowercase
        const cleanValue = value.toLowerCase().replace(/[^a-z]/g, '');
        newWords[index] = cleanValue;
        setWords(newWords);

        // Auto-focus next input if word is entered
        if (cleanValue && index < 23) {
            setTimeout(() => {
                inputRefs.current[index + 1]?.focus();
            }, 0);
        }
    };

    const handleKeyDown = (index: number, event: React.KeyboardEvent) => {
        if (event.key === 'Backspace' && !words[index] && index > 0) {
            // Move to previous input on backspace if current is empty
            inputRefs.current[index - 1]?.focus();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (index < 23) {
                inputRefs.current[index + 1]?.focus();
            } else {
                // Submit on last input
                handleSubmit();
            }
        } else if (event.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (event.key === 'ArrowRight' && index < 23) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (event: React.ClipboardEvent) => {
        event.preventDefault();
        const pastedText = event.clipboardData.getData('text');
        processPastedText(pastedText);
    };

    const processPastedText = (text: string) => {
        // Split by spaces and clean each word
        const pastedWords = text
            .trim()
            .split(/\s+/)
            .map((word) => word.toLowerCase().replace(/[^a-z]/g, ''))
            .filter((word) => word.length > 0);

        if (pastedWords.length >= 12 && pastedWords.length <= 24) {
            const newWords = Array(24).fill('');
            pastedWords.forEach((word, index) => {
                if (index < 24) {
                    newWords[index] = word;
                }
            });
            setWords(newWords);

            // Focus the first empty input or the last filled input
            const lastFilledIndex = Math.min(pastedWords.length - 1, 23);
            setTimeout(() => {
                inputRefs.current[lastFilledIndex]?.focus();
            }, 0);
        }
    };

    const handleSubmit = () => {
        const nonEmptyWords = words.filter((word) => word.trim() !== '');
        if (nonEmptyWords.length >= 12) {
            onImport(nonEmptyWords, interfaceType, walletVersion, network);
        }
    };

    const clearAll = () => {
        setWords(Array(24).fill(''));
        inputRefs.current[0]?.focus();
    };

    const isValid = words.filter((word) => word.trim() !== '').length >= 12;
    const filledCount = words.filter((word) => word.trim() !== '').length;

    return (
        <div className="space-y-4">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900" data-testid="subtitle">
                    Import Wallet
                </h2>
                <p className="mt-1 text-sm text-gray-600">Enter your recovery phrase to restore your wallet.</p>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                {/* Compact Selectors Row */}
                <div className="space-y-2 bg-gray-50 rounded-lg p-3 mb-4">
                    {/* Wallet Version */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Version</span>
                        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                            <button
                                type="button"
                                data-testid="version-select-v5r1"
                                onClick={() => setWalletVersion('v5r1')}
                                className={`px-3 py-1.5 text-xs font-medium transition-all ${
                                    walletVersion === 'v5r1'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                V5R1
                            </button>
                            <button
                                type="button"
                                data-testid="version-select-v4r2"
                                onClick={() => setWalletVersion('v4r2')}
                                className={`px-3 py-1.5 text-xs font-medium transition-all border-l border-gray-200 ${
                                    walletVersion === 'v4r2'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                V4R2
                            </button>
                        </div>
                    </div>

                    {/* Network Selector */}
                    <NetworkSelector value={network} onChange={setNetwork} compact />

                    {/* Interface Type */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Interface</span>
                        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                            <button
                                type="button"
                                data-testid="interface-select-mnemonic"
                                onClick={() => setInterfaceType('mnemonic')}
                                className={`px-3 py-1.5 text-xs font-medium transition-all ${
                                    interfaceType === 'mnemonic'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                Mnemonic
                            </button>
                            <button
                                type="button"
                                data-testid="interface-select-signer"
                                onClick={() => setInterfaceType('signer')}
                                className={`px-3 py-1.5 text-xs font-medium transition-all border-l border-gray-200 ${
                                    interfaceType === 'signer'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                Signer
                            </button>
                        </div>
                    </div>
                </div>

                {/* Word Count & Actions */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500" data-testid="word-count">
                        {filledCount}/24 words
                    </span>
                    <div className="flex space-x-3">
                        <button
                            onClick={clearAll}
                            data-testid="clear-mnemonic"
                            className="text-xs text-gray-500 hover:text-gray-700 underline"
                            type="button"
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => navigator.clipboard?.readText().then(processPastedText)}
                            data-testid="paste-mnemonic"
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                            type="button"
                        >
                            Paste
                        </button>
                    </div>
                </div>

                {/* Individual Word Inputs */}
                <div className="grid grid-cols-4 gap-1.5 mb-3" data-testid="mnemonic-input-grid">
                    {words.map((word, index) => (
                        <div key={index} className="relative">
                            <input
                                ref={(el) => {
                                    inputRefs.current[index] = el;
                                }}
                                type="text"
                                value={word}
                                onChange={(e) => handleWordChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                onFocus={() => setActiveInput(index)}
                                placeholder={`${index + 1}`}
                                data-testid={`mnemonic-input-${index + 1}`}
                                className={`w-full px-1.5 py-1.5 text-xs border rounded text-center font-mono transition-colors ${
                                    word
                                        ? 'border-green-300 bg-green-50 text-green-800'
                                        : activeInput === index
                                          ? 'border-blue-300 bg-blue-50'
                                          : 'border-gray-300 bg-white'
                                } focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                                autoComplete="off"
                                spellCheck={false}
                            />
                            <span className="absolute -top-1 left-0.5 text-[10px] text-gray-400 bg-white px-0.5">
                                {index + 1}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Help Text */}
                <p className="text-center text-xs text-gray-500 mb-4">
                    Supports 12 or 24-word phrases. Paste or type words.
                </p>

                {/* Error Display */}
                {error && <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md mb-4">{error}</div>}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-3 border-t border-gray-200">
                    <Button variant="secondary" onClick={onBack} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        data-testid="import-wallet-process"
                        onClick={handleSubmit}
                        isLoading={isLoading}
                        disabled={!isValid || isLoading}
                        className="flex-1"
                    >
                        Import Wallet
                    </Button>
                </div>
            </div>
        </div>
    );
};
