/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { NetworkType } from '@demo/wallet-core';

import {
    applyMnemonicPaste,
    evaluateBip39Slots,
    extractMnemonicWordsFromPaste,
    isImportableBip39,
} from '../utils/bip39English';
import type { Bip39SlotValidation } from '../utils/bip39English';
import { Button } from './Button';
import { NetworkSelector } from './NetworkSelector';

const TOTAL_WORDS = 24;

type SegmentOption<T extends string> = { value: T; label: string; testId: string };

function Segmented<T extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: T;
    options: readonly SegmentOption<T>[];
    onChange: (value: T) => void;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {options.map((opt, i) => {
                    const selected = value === opt.value;
                    const stateClass = selected ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50';
                    const dividerClass = i > 0 ? 'border-l border-gray-200' : '';
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            data-testid={opt.testId}
                            onClick={() => onChange(opt.value)}
                            className={`px-3 py-1.5 text-xs font-medium transition-all ${dividerClass} ${stateClass}`}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

type HintTone = 'amber' | 'gray';
type Hint = { tone: HintTone; text: string };

const HINT_CLASS: Record<HintTone, string> = {
    amber: 'text-amber-800 bg-amber-50',
    gray: 'text-gray-700 bg-gray-50',
};

function deriveHint(validation: Bip39SlotValidation): Hint | null {
    const { nonEmptyWords, invalidIndices } = validation;
    const filled = nonEmptyWords.length;

    if (filled === 24) return null;
    if (invalidIndices.length > 0) {
        return { tone: 'amber', text: 'Some entries are not in the BIP39 English word list.' };
    }
    if (filled > 12) {
        return { tone: 'gray', text: 'Exactly 12 or 24 words are required.' };
    }
    return null;
}

interface ImportWalletProps {
    onImport: (
        mnemonic: string[],
        interfaceType: 'signer' | 'mnemonic',
        version?: 'v5r1' | 'v4r2',
        network?: NetworkType,
    ) => Promise<void>;
    onBack: () => void;
    isLoading: boolean;
    error: string;
}

export const ImportWallet: React.FC<ImportWalletProps> = ({ onImport, onBack, isLoading, error }) => {
    const [words, setWords] = useState<string[]>(Array(TOTAL_WORDS).fill(''));
    const [activeInput, setActiveInput] = useState(0);
    const [interfaceType, setInterfaceType] = useState<'signer' | 'mnemonic'>('mnemonic');
    const [walletVersion, setWalletVersion] = useState<'v5r1' | 'v4r2'>('v5r1');
    const [network, setNetwork] = useState<NetworkType>('mainnet');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, TOTAL_WORDS);
        inputRefs.current[0]?.focus();
    }, []);

    const focusCell = (index: number) => {
        setTimeout(() => inputRefs.current[index]?.focus(), 0);
    };

    const handleWordChange = (index: number, value: string) => {
        const cleanValue = value.toLowerCase().replace(/[^a-z]/g, '');
        setWords((prev) => {
            const next = [...prev];
            next[index] = cleanValue;
            return next;
        });
    };

    const handleSubmit = () => {
        const v = evaluateBip39Slots(words);
        if (!isImportableBip39(v)) return;
        onImport(v.nonEmptyWords, interfaceType, walletVersion, network);
    };

    const handleKeyDown = (index: number, event: React.KeyboardEvent) => {
        const isFirst = index === 0;
        const isLast = index === TOTAL_WORDS - 1;
        // Read live DOM value: during held-key repeats React's closure may lag.
        const value = inputRefs.current[index]?.value ?? '';

        switch (event.key) {
            case 'Backspace':
                if (value.length === 0 && !isFirst) {
                    const prev = inputRefs.current[index - 1];
                    if (prev) {
                        prev.focus();
                        const end = prev.value.length;
                        prev.setSelectionRange(end, end);
                    }
                }
                return;
            case 'Enter':
                event.preventDefault();
                if (isLast) handleSubmit();
                else inputRefs.current[index + 1]?.focus();
                return;
            case 'ArrowLeft':
                if (!isFirst) inputRefs.current[index - 1]?.focus();
                return;
            case 'ArrowRight':
                if (!isLast) inputRefs.current[index + 1]?.focus();
                return;
            case ' ':
                if (!isLast && value.length > 0) {
                    event.preventDefault();
                    inputRefs.current[index + 1]?.focus();
                }
                return;
        }
    };

    const handlePaste = (index: number, event: React.ClipboardEvent) => {
        const text = event.clipboardData.getData('text/plain') || event.clipboardData.getData('text');
        const tokens = extractMnemonicWordsFromPaste(text);

        if (tokens.length === 0) {
            if (text.trim().length > 0) {
                event.preventDefault();
                handleWordChange(index, text);
            }
            return;
        }

        event.preventDefault();
        const { nextWords, focusIndex } = applyMnemonicPaste(words, index, tokens);
        setWords(nextWords);
        focusCell(focusIndex);
    };

    const handleClickPaste = () => {
        void navigator.clipboard
            ?.readText()
            .then((text) => {
                const tokens = extractMnemonicWordsFromPaste(text ?? '');
                if (tokens.length < 12) return;
                const { nextWords, focusIndex } = applyMnemonicPaste(words, 0, tokens);
                setWords(nextWords);
                focusCell(focusIndex);
            })
            .catch(() => {
                /* Clipboard API missing or denied; user can still Ctrl+V into a cell. */
            });
    };

    const clearAll = () => {
        setWords(Array(TOTAL_WORDS).fill(''));
        inputRefs.current[0]?.focus();
    };

    const validation = useMemo(() => evaluateBip39Slots(words), [words]);
    const isValid = isImportableBip39(validation);
    const hint = deriveHint(validation);
    const filledCount = validation.nonEmptyWords.length;

    const cellClassName = (index: number) => {
        if (validation.invalidIndices.includes(index)) {
            return 'border-red-400 bg-red-50 text-red-900';
        }
        if (words[index]) return 'border-green-300 bg-green-50 text-green-800';
        if (activeInput === index) return 'border-blue-300 bg-blue-50';
        return 'border-gray-300 bg-white';
    };

    return (
        <div className="space-y-4">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900" data-testid="subtitle">
                    Import Wallet
                </h2>
                <p className="mt-1 text-sm text-gray-600">Enter your recovery phrase to restore your wallet.</p>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                <div className="space-y-2 bg-gray-50 rounded-lg p-3 mb-4">
                    <Segmented
                        label="Version"
                        value={walletVersion}
                        onChange={setWalletVersion}
                        options={[
                            { value: 'v5r1', label: 'V5R1', testId: 'version-select-v5r1' },
                            { value: 'v4r2', label: 'V4R2', testId: 'version-select-v4r2' },
                        ]}
                    />
                    <NetworkSelector value={network} onChange={setNetwork} compact />
                    <Segmented
                        label="Interface"
                        value={interfaceType}
                        onChange={setInterfaceType}
                        options={[
                            { value: 'mnemonic', label: 'Mnemonic', testId: 'interface-select-mnemonic' },
                            { value: 'signer', label: 'Signer', testId: 'interface-select-signer' },
                        ]}
                    />
                </div>

                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500" data-testid="word-count">
                        {filledCount}/{TOTAL_WORDS} words
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
                            onClick={handleClickPaste}
                            data-testid="paste-mnemonic"
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                            type="button"
                        >
                            Paste
                        </button>
                    </div>
                </div>

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
                                onPaste={(e) => handlePaste(index, e)}
                                onFocus={() => setActiveInput(index)}
                                placeholder={`${index + 1}`}
                                data-testid={`mnemonic-input-${index + 1}`}
                                className={`w-full px-1.5 py-1.5 text-xs border rounded text-center font-mono transition-colors ${cellClassName(index)} focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                                autoComplete="off"
                                spellCheck={false}
                            />
                            <span className="absolute -top-1 left-0.5 text-[10px] text-gray-400 bg-white px-0.5">
                                {index + 1}
                            </span>
                        </div>
                    ))}
                </div>

                {hint && (
                    <p
                        className={`text-center text-xs rounded-md py-2 px-2 mb-2 ${HINT_CLASS[hint.tone]}`}
                        role={hint.tone === 'gray' ? undefined : 'alert'}
                    >
                        {hint.text}
                    </p>
                )}

                <p className="text-center text-xs text-gray-500 mb-4">
                    Uses the standard English BIP39 word list. Paste or type each word; press Enter or Space to go to
                    the next field.
                </p>

                {error && <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md mb-4">{error}</div>}

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
