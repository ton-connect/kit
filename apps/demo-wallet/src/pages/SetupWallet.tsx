/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Layout, Button, Card, MnemonicDisplay, ImportWallet } from '../components';
import { useTonWallet } from '../hooks';
import { useAuth, useWallet } from '../stores';

type SetupMode = 'select' | 'create' | 'import' | 'ledger';

export const SetupWallet: React.FC = () => {
    const [mode, setMode] = useState<SetupMode>('select');
    const [mnemonic, setMnemonic] = useState<string[]>([]);

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showMnemonic, setShowMnemonic] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const navigate = useNavigate();
    const { createNewWallet, createLedgerWallet, importWallet } = useTonWallet();
    const { setUseWalletInterfaceType, ledgerAccountNumber, setLedgerAccountNumber } = useAuth();
    const { hasWallet } = useWallet();

    const handleCreateWallet = async () => {
        setError('');
        setIsLoading(true);

        try {
            const newMnemonic = await createNewWallet();
            setMnemonic(newMnemonic);
            setMode('create');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create wallet');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImportWallet = async (
        mnemonicArray: string[],
        interfaceType: 'signer' | 'mnemonic',
        version?: 'v5r1' | 'v4r2',
    ) => {
        setError('');
        setIsLoading(true);

        try {
            if (mnemonicArray.length !== 12 && mnemonicArray.length !== 24) {
                throw new Error('Mnemonic must be 12 or 24 words');
            }

            // Set the wallet interface type before importing
            setUseWalletInterfaceType(interfaceType);

            await importWallet(mnemonicArray, version);
            navigate('/wallet');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import wallet');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateLedgerWallet = async () => {
        setError('');
        setIsLoading(true);

        try {
            // Set wallet interface type to ledger
            setUseWalletInterfaceType('ledger');

            await createLedgerWallet();
            navigate('/wallet');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create Ledger wallet');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmMnemonic = async () => {
        try {
            // Wallet is already created, just navigate
            navigate('/wallet');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to confirm wallet');
        }
    };

    if (mode === 'select') {
        return (
            <Layout title="Setup Wallet">
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900" data-testid="subtitle">
                            Setup Your Wallet
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">Create a new wallet or import an existing one.</p>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <div className="space-y-4">
                                <Button
                                    data-testid="new-wallet"
                                    onClick={handleCreateWallet}
                                    isLoading={isLoading}
                                    className="w-full"
                                >
                                    Create New Wallet
                                </Button>
                                <p className="text-xs text-gray-500 text-center">
                                    Generate a new 24-word recovery phrase
                                </p>
                            </div>
                        </Card>

                        <Card>
                            <div className="space-y-4">
                                <Button
                                    data-testid="import-wallet"
                                    variant="secondary"
                                    onClick={() => setMode('import')}
                                    className="w-full"
                                >
                                    Import Existing Wallet
                                </Button>
                                <p className="text-xs text-gray-500 text-center">
                                    Restore wallet using recovery phrase
                                </p>
                            </div>
                        </Card>

                        <Card>
                            <div className="space-y-4">
                                <Button variant="secondary" onClick={() => setMode('ledger')} className="w-full">
                                    Connect Ledger Hardware Wallet
                                </Button>
                                <p className="text-xs text-gray-500 text-center">Use your Ledger hardware wallet</p>
                            </div>
                        </Card>

                        {hasWallet && (
                            <Card>
                                <div className="space-y-4">
                                    <Button
                                        data-testid="go-to-dashboard"
                                        onClick={() => navigate('/wallet')}
                                        className="w-full"
                                    >
                                        Return to Dashboard
                                    </Button>
                                    <p className="text-xs text-gray-500 text-center">Access your existing wallet</p>
                                </div>
                            </Card>
                        )}
                    </div>

                    {error && <div className="text-red-600 text-sm text-center">{error}</div>}
                </div>
            </Layout>
        );
    }

    if (mode === 'create') {
        return (
            <Layout title="Your Recovery Phrase">
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900" data-testid="subtitle">
                            Save Your Recovery Phrase
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Write down these 24 words in the exact order shown.
                        </p>
                    </div>

                    <Card>
                        <div className="space-y-4">
                            <div className="relative">
                                <div className={!showMnemonic ? 'blur-sm' : ''}>
                                    <MnemonicDisplay
                                        mnemonic={mnemonic}
                                        showWarning={true}
                                        warningType="yellow"
                                        warningText="Keep this phrase safe and secret. Anyone with access to it can control your wallet."
                                    />
                                </div>

                                {!showMnemonic && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Button onClick={() => setShowMnemonic(true)} size="sm">
                                            Click to reveal
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {showMnemonic && (
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="saved"
                                            checked={isSaved}
                                            onChange={(e) => setIsSaved(e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="saved" className="text-sm text-gray-700">
                                            I have safely saved my recovery phrase
                                        </label>
                                    </div>

                                    <Button onClick={handleConfirmMnemonic} disabled={!isSaved} className="w-full">
                                        Continue
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </Layout>
        );
    }

    if (mode === 'ledger') {
        return (
            <Layout title="Connect Ledger Wallet">
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Connect Your Ledger</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Connect and unlock your Ledger hardware wallet, then select the account number.
                        </p>
                    </div>

                    <Card>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Account Number</label>
                                <p className="text-xs text-gray-500">
                                    Select which account to use from your Ledger device (0-based index)
                                </p>
                                <input
                                    type="number"
                                    min="0"
                                    max="2147483647"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    value={ledgerAccountNumber || 0}
                                    onChange={(e) => setLedgerAccountNumber(parseInt(e.target.value, 10) || 0)}
                                />
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800">Before you continue:</h3>
                                        <div className="mt-2 text-sm text-yellow-700">
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Make sure your Ledger device is connected via USB</li>
                                                <li>Unlock your Ledger device with your PIN</li>
                                                <li>Open the TON app on your Ledger device</li>
                                                <li>Enable browser support in the TON app settings if needed</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => setMode('select')}
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    Back
                                </Button>
                                <Button onClick={handleCreateLedgerWallet} isLoading={isLoading} className="w-full">
                                    Connect Ledger
                                </Button>
                            </div>

                            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
                        </div>
                    </Card>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Import Wallet">
            <Card>
                <ImportWallet
                    onImport={handleImportWallet}
                    onBack={() => setMode('select')}
                    isLoading={isLoading}
                    error={error}
                />
            </Card>
        </Layout>
    );
};
