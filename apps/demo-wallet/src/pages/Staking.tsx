/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaking, useWallet } from '@demo/wallet-core';

import { Layout, Button } from '../components';
import { StakingInterface } from '../components/staking/StakingInterface';
import { StakingInfo } from '../components/staking/StakingInfo';

export const Staking: FC = () => {
    const navigate = useNavigate();
    const { address } = useWallet();
    const { clearStaking, loadStakingData } = useStaking();

    useEffect(() => {
        if (address) {
            loadStakingData(address);
        }
        return () => clearStaking();
    }, [address, loadStakingData, clearStaking]);

    return (
        <Layout title="Staking">
            <div className="flex items-center space-x-4 mb-6">
                <Button variant="secondary" size="sm" onClick={() => navigate('/wallet')}>
                    ← Back
                </Button>
            </div>

            <div className="flex flex-col gap-6">
                <StakingInterface />
                <StakingInfo />
            </div>

            {/* Warning */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-8">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-800">
                            Staking involves locking your TON to earn rewards. Please note that unstaking may take some
                            time depending on the pool cycle.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
