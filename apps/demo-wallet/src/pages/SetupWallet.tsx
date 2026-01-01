/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useWallet } from '@demo/core';

import { Layout, Button, ImportWallet, CreateWallet, LedgerSetup } from '../components';
import { useTonWallet } from '../hooks';

type SetupTab = 'create' | 'import' | 'ledger';

export const SetupWallet: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SetupTab>('create');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { createLedgerWallet, importWallet } = useTonWallet();
    const { setUseWalletInterfaceType } = useAuth();
    const { hasWallet } = useWallet();

    const handleCreateWallet = async (mnemonic: string[], network: 'mainnet' | 'testnet') => {
        setError('');
        setIsLoading(true);

        try {
            setUseWalletInterfaceType('mnemonic');
            await importWallet(mnemonic, 'v5r1', network);
            navigate('/wallet');
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
        network?: 'mainnet' | 'testnet',
    ) => {
        setError('');
        setIsLoading(true);

        try {
            if (mnemonicArray.length !== 12 && mnemonicArray.length !== 24) {
                throw new Error('Mnemonic must be 12 or 24 words');
            }

            setUseWalletInterfaceType(interfaceType);
            await importWallet(mnemonicArray, version, network);
            navigate('/wallet');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import wallet');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateLedgerWallet = async (network: 'mainnet' | 'testnet') => {
        setError('');
        setIsLoading(true);

        try {
            setUseWalletInterfaceType('ledger');
            await createLedgerWallet(network);
            navigate('/wallet');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create Ledger wallet');
        } finally {
            setIsLoading(false);
        }
    };

    const tabs: { id: SetupTab; label: string }[] = [
        { id: 'create', label: 'New' },
        { id: 'import', label: 'Import' },
        { id: 'ledger', label: 'Ledger' },
    ];

    const headerAction = hasWallet ? (
        <Button data-testid="go-to-dashboard" onClick={() => navigate('/wallet')} size="sm" variant="secondary">
            Dashboard
        </Button>
    ) : undefined;

    return (
        <Layout title="Setup Wallet" headerAction={headerAction}>
            <div className="space-y-4">
                {/* Tab Navigation */}
                <div className="flex bg-gray-200 rounded-lg p-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setError('');
                            }}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                activeTab === tab.id
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                            data-testid={`tab-${tab.id}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'create' && (
                        <CreateWallet onConfirm={handleCreateWallet} isLoading={isLoading} error={error} />
                    )}

                    {activeTab === 'import' && (
                        <ImportWallet
                            onImport={handleImportWallet}
                            onBack={() => navigate('/')}
                            isLoading={isLoading}
                            error={error}
                        />
                    )}

                    {activeTab === 'ledger' && (
                        <LedgerSetup
                            onConnect={handleCreateLedgerWallet}
                            onBack={() => navigate('/')}
                            isLoading={isLoading}
                            error={error}
                        />
                    )}
                </div>
            </div>
        </Layout>
    );
};
