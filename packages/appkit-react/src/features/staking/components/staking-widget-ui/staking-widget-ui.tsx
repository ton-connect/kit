/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC } from 'react';
import type { StakingQuoteDirection } from '@ton/appkit';

import { CenteredAmountInput } from '../../../../components/centered-amount-input';
import { AmountPresets } from '../../../../components/amount-presets';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/tabs';
import { useI18n } from '../../../settings/hooks/use-i18n';
import { StakingInfo } from '../staking-info';
import { SelectUnstakeMode } from '../select-unstake-mode';
import styles from './staking-widget-ui.module.css';
import type { StakingContextType } from '../staking-widget-provider';
import { useBalance } from '../../../balances';
import { calculateFromLst } from '../../utils/calculate-lst';
import { ButtonWithConnect } from '../../../../components/button-with-connect';
import { AmountReversed } from '../../../../components/amount-reversed';
import { useStakingPresets } from './use-staking-presets';

export type StakingWidgetRenderProps = StakingContextType;

export const StakingWidgetUI: FC<StakingWidgetRenderProps> = ({
    amount,
    canSubmit,
    isQuoteLoading,
    error,
    providerInfo,
    providerMetadata,
    isProviderInfoLoading,
    setAmount,
    direction,
    quote,
    sendTransaction,
    isSendingTransaction,
    unstakeMode,
    setUnstakeMode,
    stakedBalance,
    isStakedBalanceLoading,
    onChangeDirection,
    isReversed,
    toggleReversed,
}) => {
    const { data: balance } = useBalance();
    const { t } = useI18n();

    const unstakeReversedAmount = useMemo(() => {
        if (!quote?.amountIn) return '0';
        return (
            calculateFromLst(quote.amountIn, providerInfo?.lstExchangeRate, providerMetadata?.stakeCoinDecimals) || '0'
        );
    }, [quote?.amountIn, providerInfo?.lstExchangeRate, providerMetadata?.stakeCoinDecimals]);

    const presets = useStakingPresets({
        direction,
        balance,
        stakedBalance,
        providerInfo,
        providerMetadata,
        isReversed,
        toggleReversed,
        setAmount,
    });

    const buttonText = useMemo(() => {
        if (error) return t(`staking.${error}`);
        return direction === 'stake' ? t('staking.continue') : t('staking.unstake');
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
                            <CenteredAmountInput
                                value={amount}
                                onValueChange={setAmount}
                                ticker={providerMetadata?.stakeCoinTicker}
                            />
                            <AmountReversed
                                value={quote?.amountOut || '0'}
                                ticker={providerMetadata?.lstTicker}
                                decimals={providerMetadata?.lstDecimals}
                            />
                        </div>

                        <AmountPresets presets={presets} onPresetSelect={setAmount} />

                        <ButtonWithConnect
                            variant="fill"
                            size="l"
                            fullWidth
                            disabled={!canSubmit || isQuoteLoading || isSendingTransaction}
                            onClick={sendTransaction}
                        >
                            {buttonText}
                        </ButtonWithConnect>
                    </div>
                </TabsContent>

                {/* ── UNSTAKE TAB ── */}
                <TabsContent className={styles.tab} value="unstake">
                    <div className={styles.content}>
                        <div className={styles.inputSection}>
                            <CenteredAmountInput
                                value={amount}
                                onValueChange={setAmount}
                                ticker={isReversed ? providerMetadata?.stakeCoinTicker : providerMetadata?.lstTicker}
                            />
                            <AmountReversed
                                value={isReversed ? quote?.amountIn || '0' : unstakeReversedAmount}
                                ticker={isReversed ? providerMetadata?.lstTicker : providerMetadata?.stakeCoinTicker}
                                decimals={
                                    isReversed ? providerMetadata?.lstDecimals : providerMetadata?.stakeCoinDecimals
                                }
                                symbol={isReversed ? undefined : '~'}
                                onChangeDirection={providerMetadata?.supportsReversedQuote ? toggleReversed : undefined}
                            />
                        </div>

                        <AmountPresets presets={presets} onPresetSelect={setAmount} />

                        <ButtonWithConnect
                            variant="fill"
                            size="l"
                            fullWidth
                            disabled={!canSubmit || isQuoteLoading || isSendingTransaction}
                            onClick={sendTransaction}
                        >
                            {buttonText}
                        </ButtonWithConnect>

                        <SelectUnstakeMode
                            value={unstakeMode}
                            onValueChange={setUnstakeMode}
                            providerInfo={providerInfo}
                            providerMetadata={providerMetadata}
                        />
                    </div>
                </TabsContent>

                <StakingInfo
                    quote={quote}
                    isQuoteLoading={isQuoteLoading}
                    providerInfo={providerInfo}
                    providerMetadata={providerMetadata}
                    isProviderInfoLoading={isProviderInfoLoading}
                    direction={direction}
                    stakedBalance={stakedBalance?.stakedBalance}
                    isStakedBalanceLoading={isStakedBalanceLoading}
                />
            </Tabs>
        </div>
    );
};
