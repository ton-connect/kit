/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { useStaking } from '@demo/wallet-core';

import { Card } from '../Card';

export const StakingInfo: FC = () => {
    const { stakedBalance, providerInfo } = useStaking();

    return (
        <div className="space-y-6">
            <Card title="Your Stake">
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Balance</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {stakedBalance?.stakedBalance ? stakedBalance?.stakedBalance : '0.00'} tsTON
                        </p>
                    </div>
                </div>
            </Card>

            <Card title="Pool Info">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Provider</span>
                        <span className="text-sm font-medium">Tonstakers</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">APY</span>
                        <span className="text-sm font-bold text-green-600">
                            {providerInfo?.apy ? `${providerInfo.apy.toFixed(2)}%` : '--'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Instant Unstake Available</span>
                        <span className="text-sm font-medium">
                            {providerInfo?.instantUnstakeAvailable
                                ? Number(providerInfo?.instantUnstakeAvailable).toFixed(4)
                                : '0.00'}{' '}
                            TON
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    );
};
