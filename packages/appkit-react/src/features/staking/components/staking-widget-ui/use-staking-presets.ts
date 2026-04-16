/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useMemo } from 'react';
import type { StakingQuoteDirection, StakingProviderInfo, StakingProviderMetadata, StakingBalance } from '@ton/appkit';
import { truncateDecimals } from '@ton/appkit';

import type { AmountPreset } from '../../../../components/amount-presets';
import { useI18n } from '../../../settings/hooks/use-i18n';
import { calculateFromLst } from '../../utils/calculate-lst';

interface UseStakingPresetsOptions {
    direction: StakingQuoteDirection;
    balance: string | undefined;
    stakedBalance: StakingBalance | undefined;
    providerInfo: StakingProviderInfo | undefined;
    providerMetadata: StakingProviderMetadata | undefined;
    isReversed: boolean;
    toggleReversed: () => void;
    setAmount: (value: string) => void;
}

export const useStakingPresets = ({
    direction,
    balance,
    stakedBalance,
    providerInfo,
    providerMetadata,
    isReversed,
    toggleReversed,
    setAmount,
}: UseStakingPresetsOptions): AmountPreset[] => {
    const { t } = useI18n();

    const stakedBalanceInTon = useMemo(() => {
        if (!stakedBalance?.stakedBalance) return '0';
        return (
            calculateFromLst(
                stakedBalance.stakedBalance,
                providerInfo?.lstExchangeRate,
                providerMetadata?.stakeTokenDecimals,
            ) || '0'
        );
    }, [stakedBalance?.stakedBalance, providerInfo?.lstExchangeRate, providerMetadata?.stakeTokenDecimals]);

    const unstakePresetBalance = isReversed ? stakedBalanceInTon : stakedBalance?.stakedBalance;
    const presetBalance = direction === 'unstake' ? unstakePresetBalance : balance;

    const selectMaxUnstake = useCallback(() => {
        if (isReversed) {
            toggleReversed();
        }
        setAmount(stakedBalance?.stakedBalance ?? '');
    }, [isReversed, toggleReversed, setAmount, stakedBalance?.stakedBalance]);

    return useMemo(() => {
        const calc = (value: number, pct: number) => truncateDecimals(value * pct, 4);
        const parsed = presetBalance ? parseFloat(presetBalance) : 0;

        if (!parsed) {
            return [
                { label: '10%', amount: '' },
                { label: '50%', amount: '' },
                { label: '75%', amount: '' },
                { label: t('staking.max'), amount: '' },
            ];
        }

        const maxOnSelect = direction === 'unstake' && isReversed ? selectMaxUnstake : undefined;

        return [
            { label: '10%', amount: calc(parsed, 0.1) },
            { label: '50%', amount: calc(parsed, 0.5) },
            { label: '75%', amount: calc(parsed, 0.75) },
            { label: t('staking.max'), amount: presetBalance ?? '', onSelect: maxOnSelect },
        ];
    }, [presetBalance, direction, isReversed, selectMaxUnstake, t]);
};
