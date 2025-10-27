/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState } from 'react';

interface MnemonicDisplayProps {
    mnemonic: string[];
    showWarning?: boolean;
    warningText?: string;
    warningType?: 'yellow' | 'red';
}

export const MnemonicDisplay: React.FC<MnemonicDisplayProps> = ({
    mnemonic,
    showWarning = false,
    warningText = 'Keep this phrase safe and secret. Anyone with access to it can control your wallet.',
    warningType = 'yellow',
}) => {
    const [copyFeedback, setCopyFeedback] = useState('');

    const handleCopyMnemonic = async () => {
        try {
            const mnemonicString = mnemonic.join(' ');
            await navigator.clipboard.writeText(mnemonicString);
            setCopyFeedback('Copied to clipboard!');
            setTimeout(() => setCopyFeedback(''), 2000);
        } catch (_) {
            setCopyFeedback('Failed to copy');
            setTimeout(() => setCopyFeedback(''), 2000);
        }
    };

    const warningStyles =
        warningType === 'yellow'
            ? {
                  bgColor: 'bg-yellow-50',
                  borderColor: 'border-yellow-200',
                  iconColor: 'text-yellow-400',
                  textColor: 'text-yellow-800',
              }
            : {
                  bgColor: 'bg-red-50',
                  borderColor: 'border-red-200',
                  iconColor: 'text-red-400',
                  textColor: 'text-red-800',
              };

    return (
        <div className="space-y-4">
            {/* Warning */}
            {showWarning && (
                <div className={`${warningStyles.bgColor} ${warningStyles.borderColor} rounded-md p-4`}>
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg
                                className={`h-5 w-5 ${warningStyles.iconColor}`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className={`text-sm ${warningStyles.textColor}`}>
                                {warningType === 'red' && <strong>Warning: </strong>}
                                {warningText}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Mnemonic Grid */}
            <div className="grid grid-cols-4 gap-2">
                {mnemonic.map((word, index) => (
                    <div
                        key={index}
                        className="bg-gray-50 border border-gray-200 rounded-md p-2 text-center text-sm font-mono"
                    >
                        <span className="text-gray-500 text-xs">{index + 1}.</span>
                        <div className="font-medium text-xs text-gray-900">{word}</div>
                    </div>
                ))}
            </div>

            {/* Copy Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleCopyMnemonic}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors border border-gray-300"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                    <span>Copy Recovery Phrase</span>
                </button>
            </div>

            {/* Copy Feedback */}
            {copyFeedback && (
                <div
                    className={`text-center text-sm ${copyFeedback.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}
                >
                    {copyFeedback}
                </div>
            )}
        </div>
    );
};
