/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ChangeEvent } from 'react';
import { useState } from 'react';
import { useStaking } from '@demo/wallet-core';
import { useNavigate } from 'react-router-dom';

import { Card } from '../Card';
import { Button } from '../Button';

import { cn } from '@/lib/utils';

export const StakingInterface: FC = () => {
    const {
        amount,
        currentQuote,
        isLoadingQuote,
        isStaking,
        isUnstaking,
        error,
        unstakeMode,
        setStakingAmount: setAmount,
        setUnstakeMode,
        getStakingQuote: getQuote,
        stake,
        unstake,
        validateStakingInputs,
    } = useStaking();

    const [tab, setTab] = useState<'stake' | 'unstake'>('stake');

    const navigate = useNavigate();

    const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
    };

    const handleGetQuote = async () => {
        await getQuote({
            amount,
            direction: tab === 'stake' ? 'stake' : 'unstake',
        });
    };

    const handleAction = async () => {
        if (!currentQuote) return;

        if (tab === 'stake') {
            await stake({ quote: currentQuote });
        } else {
            await unstake({ quote: currentQuote });
        }

        navigate('/wallet', {
            state: { message: `${tab === 'stake' ? 'Staked' : 'Unstaked'} successfully!` },
        });
    };

    const validationError = validateStakingInputs();
    const canGetQuote = !validationError && amount && parseFloat(amount) > 0;

    return (
        <Card className="w-full">
            <div className="flex border-b border-gray-100 mb-6">
                <button
                    className={cn(
                        'flex-1 pb-3 text-sm font-medium transition-colors border-b-2',
                        tab === 'stake'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700',
                    )}
                    onClick={() => {
                        setTab('stake');
                        setAmount('');
                    }}
                >
                    Stake
                </button>
                <button
                    className={cn(
                        'flex-1 pb-3 text-sm font-medium transition-colors border-b-2',
                        tab === 'unstake'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700',
                    )}
                    onClick={() => {
                        setTab('unstake');
                        setAmount('');
                    }}
                >
                    Unstake
                </button>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount to {tab === 'stake' ? 'Stake' : 'Unstake'}
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0.0"
                            className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-lg font-medium"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                            <span className="text-sm font-bold text-gray-500">{tab === 'stake' ? 'TON' : 'tsTON'}</span>
                        </div>
                    </div>
                    {validationError && amount !== '' && <p className="mt-2 text-sm text-red-500">{validationError}</p>}
                </div>

                {tab === 'unstake' && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Unstake Method</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['delayed', 'instant', 'bestRate'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setUnstakeMode(mode)}
                                    className={cn(
                                        'px-3 py-2 text-xs font-medium rounded-lg border transition-all',
                                        unstakeMode === mode
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600',
                                    )}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-500 italic">
                            {unstakeMode === 'delayed' &&
                                'Standard withdrawal. Immediate if liquid, or up to ~18h queue'}
                            {unstakeMode === 'instant' && 'Receive TON immediately'}
                            {unstakeMode === 'bestRate' && 'Wait for cycle end (~18h) for best rate'}
                        </p>
                    </div>
                )}

                {currentQuote && (
                    <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-blue-600">You will receive</span>
                            <span className="font-bold text-blue-900">
                                {currentQuote.amountOut} {tab === 'stake' ? 'tsTON' : 'TON'}
                            </span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {!currentQuote ? (
                    <Button
                        className="w-full py-4 text-lg font-bold"
                        onClick={handleGetQuote}
                        disabled={!canGetQuote || isLoadingQuote}
                        isLoading={isLoadingQuote}
                    >
                        Preview {tab === 'stake' ? 'Stake' : 'Unstake'}
                    </Button>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="secondary"
                            className="py-4 font-bold"
                            onClick={() => setAmount('')}
                            disabled={isStaking || isUnstaking}
                        >
                            Cancel
                        </Button>
                        <Button className="py-4 font-bold" onClick={handleAction} isLoading={isStaking || isUnstaking}>
                            Confirm {tab === 'stake' ? 'Stake' : 'Unstake'}
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
};
