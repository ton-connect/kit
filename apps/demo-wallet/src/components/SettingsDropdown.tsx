import React, { useState, useRef, useEffect } from 'react';

import { useAuth, useWallet } from '../stores';
import { MnemonicDisplay } from './MnemonicDisplay';
import { createComponentLogger } from '../utils/logger';

// Create logger for settings dropdown component
const log = createComponentLogger('SettingsDropdown');

export const SettingsDropdown: React.FC = () => {
    const {
        lock,
        reset,
        persistPassword,
        setPersistPassword,
        useWalletInterfaceType,
        setUseWalletInterfaceType,
        ledgerAccountNumber,
        setLedgerAccountNumber,
        network,
        setNetwork,
    } = useAuth();
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
        <>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    aria-label="Wallet menu"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                    </svg>
                </button>

                {isDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                        <div className="py-1">
                            {/* Wallet Actions */}
                            <div className="px-4 py-2 border-b border-gray-100">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Wallet Actions</h3>
                                <div className="space-y-1">
                                    <button
                                        onClick={handleViewRecoveryPhrase}
                                        disabled={isLoadingMnemonic}
                                        className="w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                        className="w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center space-x-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                        className="w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded flex items-center space-x-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                            {/* Settings Section */}
                            <div className="px-4 py-3">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Settings</h3>
                                <div className="space-y-4">
                                    {/* Remember Password */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">
                                                Remember Password
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Keep wallet unlocked between app reloads
                                            </p>
                                        </div>
                                        <label
                                            data-test-id="password-remember"
                                            className="relative inline-flex items-center cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={persistPassword || false}
                                                onChange={(e) => setPersistPassword(e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    {persistPassword && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg
                                                        className="h-5 w-5 text-yellow-400"
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
                                                    <p className="text-sm text-yellow-800">
                                                        <strong>Security Notice:</strong> Storing your password locally
                                                        is not safe, do not use this feature for anything other than
                                                        development.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Network Selection */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Network</label>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Select the blockchain network (requires wallet reload)
                                            </p>
                                        </div>
                                        <select
                                            className="px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                                            value={network || 'testnet'}
                                            onChange={(e) => {
                                                const newNetwork = e.target.value as 'mainnet' | 'testnet';
                                                setNetwork(newNetwork);
                                                // Show warning that wallet needs to be reloaded
                                                if (
                                                    confirm('Network changed. The wallet will reload to apply changes.')
                                                ) {
                                                    window.location.reload();
                                                }
                                            }}
                                        >
                                            <option value="testnet">Testnet</option>
                                            <option value="mainnet">Mainnet</option>
                                        </select>
                                    </div>

                                    {/* Wallet Interface Type */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">
                                                Wallet Interface Type
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Choose how the wallet handles signing operations
                                            </p>
                                        </div>
                                        <select
                                            className="px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                                            value={useWalletInterfaceType || 'mnemonic'}
                                            onChange={(e) =>
                                                setUseWalletInterfaceType(
                                                    e.target.value as 'signer' | 'mnemonic' | 'ledger',
                                                )
                                            }
                                        >
                                            <option value="mnemonic">Mnemonic</option>
                                            <option value="signer">Signer</option>
                                            <option value="ledger">Ledger Hardware Wallet</option>
                                        </select>
                                    </div>

                                    {/* Ledger Account Number */}
                                    {useWalletInterfaceType === 'ledger' && (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">
                                                    Ledger Account Number
                                                </label>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Account number for Ledger derivation path
                                                </p>
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                max="2147483647"
                                                className="px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                                                value={ledgerAccountNumber || 0}
                                                onChange={(e) =>
                                                    setLedgerAccountNumber(parseInt(e.target.value, 10) || 0)
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

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
        </>
    );
};
