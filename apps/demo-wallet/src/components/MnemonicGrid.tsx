/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState } from 'react';

interface MnemonicGridProps {
    mnemonic: string[];
}

export const MnemonicGrid: React.FC<MnemonicGridProps> = ({ mnemonic }) => {
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
        <div className="space-y-3" data-testid="mnemonic-grid">
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
            <div className="grid grid-cols-4 gap-1" data-testid="mnemonic-words">
                {mnemonic.map((word, index) => (
                    <div
                        key={index}
                        className="bg-gray-50 border border-gray-200 rounded p-1 text-center"
                        data-testid={`mnemonic-word-${index + 1}`}
                    >
                        <span className="text-gray-400 text-[10px]">{index + 1}.</span>
                        <div className="font-medium text-[10px] text-gray-900 truncate">{word}</div>
                    </div>
                ))}
            </div>

            {/* Copy Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleCopyMnemonic}
                    data-testid="copy-mnemonic"
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
