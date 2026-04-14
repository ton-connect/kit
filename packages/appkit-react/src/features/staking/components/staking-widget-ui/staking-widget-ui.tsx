/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC } from 'react';
import { UnstakeMode } from '@ton/appkit';
import type { StakingQuoteDirection, UnstakeModes } from '@ton/appkit';

import { CenteredAmountInput } from '../../../../components/centered-amount-input';
import { AmountPresets } from '../../../../components/amount-presets';
import type { AmountPreset } from '../../../../components/amount-presets';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/tabs';
import { useI18n } from '../../../settings/hooks/use-i18n';
import { useConnect, useConnectors, useSelectedWallet } from '../../../wallets';
import { StakingInfo } from '../staking-info';
import styles from './staking-widget-ui.module.css';
import type { StakingContextType } from '../staking-widget-provider';
import { useBalance } from '../../../balances';
import { getFormattedFiatValue, getPresets } from './utils';
import { ButtonWithConnect } from '../../../../components/button-with-connect';

export type StakingWidgetRenderProps = StakingContextType;

export const StakingWidgetUI: FC<StakingWidgetRenderProps> = ({
    amount,
    fiatSymbol,
    canSubmit,
    isQuoteLoading,
    error,
    providerInfo,
    isProviderInfoLoading,
    setAmount,
    direction,
    quote,
    tonRate,
    sendStakingTransaction,
    sendUnstakingTransaction,
    isSendingTransaction,
    unstakeMode,
    setUnstakeMode,
    stakedBalance,
    isStakedBalanceLoading,
    onChangeDirection,
}) => {
    const { data: balance } = useBalance();

    const { t } = useI18n();

    const presets: AmountPreset[] = useMemo(() => {
        return getPresets(direction === 'unstake' ? stakedBalance?.stakedBalance : balance, t);
    }, [balance, direction, t]);

    const unstakeModes: { value: UnstakeModes; label: string }[] = useMemo(
        () => [
            { value: UnstakeMode.INSTANT, label: t('staking.instant') },
            { value: UnstakeMode.WHEN_AVAILABLE, label: t('staking.whenAvailable') },
            { value: UnstakeMode.ROUND_END, label: t('staking.roundEnd') },
        ],
        [t],
    );

    const buttonText = useMemo(() => {
        if (error) return t(`staking.${error}`);
        if (direction === 'stake') return t('staking.continue');

        return t('staking.unstake');
    }, [error, direction, t]);

    return (
        <div className={styles.widget}>
            <Tabs defaultValue={direction} onValueChange={(value) => onChangeDirection(value as StakingQuoteDirection)}>
                <TabsList>
                    <TabsTrigger value="stake">{t('staking.stake')}</TabsTrigger>
                    <TabsTrigger value="unstake">{t('staking.unstake')}</TabsTrigger>
                </TabsList>

                {/* ── STAKE TAB ── */}
                <TabsContent className={styles.tab} value="stake">
                    <div className={styles.content}>
                        <div className={styles.inputSection}>
                            <CenteredAmountInput value={amount} onValueChange={setAmount} ticker="TON" />
                            {tonRate && (
                                <span className={styles.fiatValue}>
                                    {getFormattedFiatValue(amount, tonRate, fiatSymbol)}
                                </span>
                            )}
                        </div>

                        <AmountPresets presets={presets} onPresetSelect={setAmount} />
                    </div>
                </TabsContent>

                {/* ── UNSTAKE TAB ── */}
                <TabsContent className={styles.tab} value="unstake">
                    <div className={styles.content}>
                        <div className={styles.inputSection}>
                            <CenteredAmountInput value={amount} onValueChange={setAmount} ticker="tsTON" />
                            {tonRate && (
                                <span className={styles.fiatValue}>
                                    {getFormattedFiatValue(amount, tonRate, fiatSymbol)}
                                </span>
                            )}
                        </div>

                        <AmountPresets presets={presets} onPresetSelect={setAmount} />

                        <div className={styles.unstakeModes}>
                            {unstakeModes.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={`${styles.unstakeModeBtn} ${unstakeMode === value ? styles.unstakeModeBtnActive : ''}`}
                                    onClick={() => setUnstakeMode(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <ButtonWithConnect
                    variant="fill"
                    size="l"
                    fullWidth
                    disabled={!canSubmit || isQuoteLoading || isSendingTransaction}
                    onClick={direction === 'stake' ? sendStakingTransaction : sendUnstakingTransaction}
                >
                    {buttonText}
                </ButtonWithConnect>

                <StakingInfo
                    className={styles.infoBlock}
                    quote={quote}
                    isQuoteLoading={isQuoteLoading}
                    providerInfo={providerInfo}
                    isProviderInfoLoading={isProviderInfoLoading}
                    direction={direction}
                    stakedBalance={stakedBalance?.stakedBalance}
                    isStakedBalanceLoading={isStakedBalanceLoading}
                />
            </Tabs>
        </div>
    );
};
