import React, { useState, useRef, useEffect } from 'react';

import { Button } from './Button';

interface ImportWalletProps {
    onImport: (mnemonic: string[], interfaceType: 'signer' | 'mnemonic', version?: 'v5r1' | 'v4r2') => Promise<void>;
    onBack: () => void;
    isLoading: boolean;
    error: string;
}

export const ImportWallet: React.FC<ImportWalletProps> = ({ onImport, onBack, isLoading, error }) => {
    const [words, setWords] = useState<string[]>(Array(24).fill(''));
    const [activeInput, setActiveInput] = useState(0);
    const [pasteMode, setPasteMode] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [interfaceType, setInterfaceType] = useState<'signer' | 'mnemonic'>('mnemonic');
    const [walletVersion, setWalletVersion] = useState<'v5r1' | 'v4r2'>('v5r1');
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

    const handlePasteModeSubmit = () => {
        processPastedText(pasteText);
        setPasteMode(false);
        setPasteText('');
    };

    const handleSubmit = () => {
        const nonEmptyWords = words.filter((word) => word.trim() !== '');
        if (nonEmptyWords.length >= 12) {
            onImport(nonEmptyWords, interfaceType, walletVersion);
        }
    };

    const clearAll = () => {
        setWords(Array(24).fill(''));
        inputRefs.current[0]?.focus();
    };

    const isValid = words.filter((word) => word.trim() !== '').length >= 12;
    const filledCount = words.filter((word) => word.trim() !== '').length;

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900" data-test-id="subtitle">
                    Import Wallet
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Enter your 12 or 24-word recovery phrase to restore your TON wallet.
                </p>
            </div>

            {/* Wallet Version Selector */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Wallet Version</label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setWalletVersion('v5r1')}
                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                            walletVersion === 'v5r1'
                                ? 'bg-blue-50 text-blue-700 border-blue-500'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <div className="flex flex-col items-center space-y-1">
                            <span className="font-semibold">V5R1</span>
                            <span className="text-xs text-gray-500">Latest version</span>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setWalletVersion('v4r2')}
                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                            walletVersion === 'v4r2'
                                ? 'bg-blue-50 text-blue-700 border-blue-500'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <div className="flex flex-col items-center space-y-1">
                            <span className="font-semibold">V4R2</span>
                            <span className="text-xs text-gray-500">Legacy version</span>
                        </div>
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    {walletVersion === 'v5r1'
                        ? 'Latest wallet version with enhanced features and security.'
                        : 'Legacy wallet version for compatibility with older wallets.'}
                </p>
            </div>

            {/* Wallet Interface Type Selector */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Wallet Interface Type</label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setInterfaceType('mnemonic')}
                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                            interfaceType === 'mnemonic'
                                ? 'bg-blue-50 text-blue-700 border-blue-500'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <div className="flex flex-col items-center space-y-1">
                            <span className="font-semibold">Mnemonic</span>
                            <span className="text-xs text-gray-500">Standard wallet</span>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setInterfaceType('signer')}
                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                            interfaceType === 'signer'
                                ? 'bg-blue-50 text-blue-700 border-blue-500'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <div className="flex flex-col items-center space-y-1">
                            <span className="font-semibold">Signer</span>
                            <span className="text-xs text-gray-500">Custom signing</span>
                        </div>
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    {interfaceType === 'mnemonic'
                        ? 'Standard wallet interface that handles key derivation automatically.'
                        : 'Custom signer interface that provides manual control over transaction signing.'}
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex justify-center space-x-4">
                <button
                    onClick={() => setPasteMode(false)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        !pasteMode
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Individual Words
                </button>
                <button
                    data-test-id="paste-all"
                    onClick={() => setPasteMode(true)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        pasteMode
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Paste All
                </button>
            </div>

            {!pasteMode ? (
                <>
                    {/* Word Count Indicator */}
                    <div className="text-center">
                        <span className="text-sm text-gray-500">{filledCount} of 24 words entered</span>
                    </div>

                    {/* Individual Word Inputs */}
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
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
                                    className={`w-full px-2 py-2 text-sm border rounded-md text-center font-mono transition-colors ${
                                        word
                                            ? 'border-green-300 bg-green-50 text-green-800'
                                            : activeInput === index
                                              ? 'border-blue-300 bg-blue-50'
                                              : 'border-gray-300 bg-white'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                                <span className="absolute -top-1 left-1 text-xs text-gray-400 bg-white px-1">
                                    {index + 1}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex justify-center space-x-3">
                        <button
                            onClick={clearAll}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                            type="button"
                        >
                            Clear All
                        </button>
                        <button
                            onClick={() => navigator.clipboard?.readText().then(processPastedText)}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                            type="button"
                        >
                            Paste from Clipboard
                        </button>
                    </div>
                </>
            ) : (
                /* Paste Mode */
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Recovery Phrase</label>
                        <textarea
                            data-test-id="mnemonic"
                            value={pasteText}
                            onChange={(e) => setPasteText(e.target.value)}
                            placeholder="Paste your entire recovery phrase here..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Separate words with spaces. 12 or 24 words supported.
                        </p>
                    </div>

                    <Button
                        data-test-id="mnemonic-process"
                        onClick={handlePasteModeSubmit}
                        disabled={!pasteText.trim()}
                        className="w-full"
                    >
                        Process Words
                    </Button>
                </div>
            )}

            {/* Error Display */}
            {error && <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">{error}</div>}

            {/* Action Buttons */}
            <div className="flex space-x-3">
                <Button variant="secondary" onClick={onBack} className="flex-1">
                    Back
                </Button>
                <Button
                    data-test-id="import-wallet-process"
                    onClick={handleSubmit}
                    isLoading={isLoading}
                    disabled={!isValid || isLoading}
                    className="flex-1"
                >
                    Import Wallet
                </Button>
            </div>

            {/* Help Text */}
            <div className="text-center text-xs text-gray-500">
                <p>Make sure your recovery phrase is correct. Wrong phrases cannot be recovered.</p>
                <p className="mt-1">Supports both 12-word (legacy) and 24-word recovery phrases.</p>
            </div>
        </div>
    );
};
