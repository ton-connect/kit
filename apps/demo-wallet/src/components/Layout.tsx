import React, { useState, useRef, useEffect } from 'react';

import { useAuth, useWallet } from '../stores';
import { MnemonicDisplay } from './MnemonicDisplay';
import { createComponentLogger } from '../utils/logger';

// Create logger for layout component
const log = createComponentLogger('Layout');

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
    showLogout?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, title = 'TON Wallet', showLogout = false }) => {
    const { lock, reset } = useAuth();
    const { getDecryptedMnemonic } = useWallet();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showMnemonicModal, setShowMnemonicModal] = useState(false);
    const [mnemonic, setMnemonic] = useState<string[]>([]);
    const [isLoadingMnemonic, setIsLoadingMnemonic] = useState(false);
    const [mnemonicError, setMnemonicError] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLockWallet = () => {
        lock();
        setIsDropdownOpen(false);
    };

    const handleDeleteWallet = () => {
        if (window.confirm('Are you sure you want to delete your wallet? This action cannot be undone.')) {
            reset();
            setIsDropdownOpen(false);
        }
    };

    const handleViewRecoveryPhrase = async () => {
        setIsDropdownOpen(false);
        setIsLoadingMnemonic(true);
        setMnemonicError('');

        try {
            const decryptedMnemonic = await getDecryptedMnemonic();
            if (decryptedMnemonic) {
                setMnemonic(decryptedMnemonic);
                setShowMnemonicModal(true);
            } else {
                setMnemonicError('Unable to retrieve recovery phrase. Please ensure you are logged in.');
            }
        } catch (error) {
            setMnemonicError('Failed to decrypt recovery phrase. Please try again.');
            log.error('Error retrieving mnemonic:', error);
        } finally {
            setIsLoadingMnemonic(false);
        }
    };

    const handleCloseMnemonicModal = () => {
        setShowMnemonicModal(false);
        setMnemonic([]);
        setMnemonicError('');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Close modal with Escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && showMnemonicModal) {
                handleCloseMnemonicModal();
            }
        };

        if (showMnemonicModal) {
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [showMnemonicModal]);

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="sm:w-md md:w-lg mx-auto px-4 py-2 flex justify-between items-center">
                    <h1 className="text-lg font-bold text-gray-900" data-test-id="title">
                        {title}
                    </h1>
                    {showLogout && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                                aria-label="Wallet menu"
                            >
                                <svg
                                    className="w-5 h-5 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                    />
                                </svg>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                    <div className="py-1">
                                        <button
                                            onClick={handleViewRecoveryPhrase}
                                            disabled={isLoadingMnemonic}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                            <span>{isLoadingMnemonic ? 'Loading...' : 'View Recovery Phrase'}</span>
                                        </button>
                                        <button
                                            onClick={handleLockWallet}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                />
                                            </svg>
                                            <span>Lock Wallet</span>
                                        </button>
                                        <button
                                            onClick={handleDeleteWallet}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </svg>
                                            <span>Delete Wallet</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Recovery Phrase Modal */}
            {showMnemonicModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 data-test-id="request" className="text-xl font-bold text-gray-900">
                                    Your Recovery Phrase
                                </h2>
                                <button
                                    onClick={handleCloseMnemonicModal}
                                    className="text-gray-400 hover:text-gray-600"
                                    aria-label="Close"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Mnemonic Display */}
                                {mnemonic.length > 0 && (
                                    <MnemonicDisplay
                                        mnemonic={mnemonic}
                                        showWarning={true}
                                        warningType="red"
                                        warningText="Never share your recovery phrase with anyone. Anyone with access to these words can control your wallet."
                                    />
                                )}

                                {/* Error Display */}
                                {mnemonicError && (
                                    <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                                        {mnemonicError}
                                    </div>
                                )}

                                {/* Close Button */}
                                <div className="pt-4">
                                    <button
                                        onClick={handleCloseMnemonicModal}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-md mx-auto px-4 py-6">{children}</main>
        </div>
    );
};
