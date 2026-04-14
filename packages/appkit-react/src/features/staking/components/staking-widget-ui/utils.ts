/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { calcFiatValue, UnstakeMode } from '@ton/appkit';

import type { I18n } from '../../../../libs/i18n';
import type { AmountPreset } from '../../../../components/amount-presets';

export const getUnstakeModes = (t: I18n['t']) => {
    return [
        { value: UnstakeMode.INSTANT, label: t('staking.instant') },
        { value: UnstakeMode.WHEN_AVAILABLE, label: t('staking.whenAvailable') },
        { value: UnstakeMode.ROUND_END, label: t('staking.roundEnd') },
    ];
};

export const getFormattedFiatValue = (amount: string, tonRate: string, fiatSymbol: string) => {
    const parsedAmount = calcFiatValue(amount || '0', tonRate);

    return `${fiatSymbol}${parsedAmount}`;
};

export const getPresets = (balance: string | undefined, t: I18n['t']): AmountPreset[] => {
    const calc = (balance: number, percentage: number) => Number((balance * percentage).toFixed(4)).toString();
    const formattedBalance = balance ? parseFloat(balance) : 0;

    if (!formattedBalance) {
        return [
            { label: '10%', amount: '' },
            { label: '50%', amount: '' },
            { label: '75%', amount: '' },
            { label: t('staking.max'), amount: '' },
        ];
    }

    return [
        { label: '10%', amount: calc(formattedBalance, 0.1) },
        { label: '50%', amount: calc(formattedBalance, 0.5) },
        { label: '75%', amount: calc(formattedBalance, 0.75) },
        { label: t('staking.max'), amount: balance ?? '' },
    ];
};
