/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState } from 'react';
import { useAuth } from '@demo/wallet-core';

import { Button } from './Button';
import { NetworkSelector } from './NetworkSelector';

interface LedgerSetupProps {
    onConnect: (network: 'mainnet' | 'testnet') => Promise<void>;
    onBack: () => void;
    isLoading: boolean;
    error: string;
}

export const LedgerSetup: React.FC<LedgerSetupProps> = ({ onConnect, onBack, isLoading, error }) => {
    const [network, setNetwork] = useState<'mainnet' | 'testnet'>('mainnet');
    const { ledgerAccountNumber, setLedgerAccountNumber } = useAuth();

    const handleConnect = async () => {
        await onConnect(network);
    };

    return (
        <div className="space-y-4">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">Connect Ledger</h2>
                <p className="mt-1 text-xs text-gray-600">Connect your Ledger hardware wallet.</p>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                <div className="space-y-4">
                    <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                        <NetworkSelector value={network} onChange={setNetwork} compact />

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Account</span>
                            <input
                                type="number"
                                min="0"
                                max="2147483647"
                                className="w-20 px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                value={ledgerAccountNumber || 0}
                                onChange={(e) => setLedgerAccountNumber(parseInt(e.target.value, 10) || 0)}
                            />
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <h3 className="text-xs font-medium text-yellow-800 mb-2">Before you continue:</h3>
                        <ul className="text-xs text-yellow-700 space-y-1 list-disc pl-4">
                            <li>Connect Ledger via USB</li>
                            <li>Unlock with PIN</li>
                            <li>Open TON app</li>
                        </ul>
                    </div>

                    <div className="flex space-x-3">
                        <Button variant="secondary" onClick={onBack} className="flex-1" disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleConnect} isLoading={isLoading} className="flex-1">
                            Connect
                        </Button>
                    </div>

                    {error && <div className="text-red-600 text-xs text-center">{error}</div>}
                </div>
            </div>
        </div>
    );
};
