/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { ComponentProps, FC } from 'react';
import type { StakingQuoteDirection } from '@ton/appkit';
import clsx from 'clsx';

import { CenteredAmountInput } from '../../../../components/centered-amount-input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/tabs';
import { useI18n } from '../../../settings/hooks/use-i18n';
import { StakingBalanceBlock } from '../staking-balance-block';
import { StakingInfo } from '../staking-info';
import { SelectUnstakeMode } from '../select-unstake-mode';
import styles from './staking-widget-ui.module.css';
import type { StakingContextType } from '../staking-widget-provider';
import { ButtonWithConnect } from '../../../../components/button-with-connect';
import { AmountReversed } from '../../../../components/amount-reversed';
import { LowBalanceModal } from '../../../../components/low-balance-modal';

export type StakingWidgetRenderProps = StakingContextType & ComponentProps<'div'>;

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
    reversedAmount,
    onMaxClick,
    balance,
    isBalanceLoading,
    isLowBalanceWarningOpen,
    lowBalanceMode,
    lowBalanceRequiredTon,
    onLowBalanceChange,
    onLowBalanceCancel,
    className,
    ...props
}) => {
    const { t } = useI18n();

    const receiveToken = providerMetadata?.receiveToken;
    const stakeToken = providerMetadata?.stakeToken;

    const buttonText = useMemo(() => {
        if (error) return t(`staking.${error}`);
        return direction === 'stake' ? t('staking.continue') : t('staking.unstake');
    }, [error, direction, t]);

    return (
        <div className={clsx(styles.widget, className)} {...props}>
            <Tabs defaultValue={direction} onValueChange={(value) => onChangeDirection(value as StakingQuoteDirection)}>
                <TabsList>
                    <TabsTrigger value="stake">{t('staking.stake')}</TabsTrigger>
                    <TabsTrigger value="unstake">{t('staking.unstake')}</TabsTrigger>
                </TabsList>

                {/* ── STAKE TAB ── */}
                <TabsContent className={styles.tab} value="stake">
                    <div className={styles.content}>
                        <div className={styles.inputSection}>
                            <CenteredAmountInput value={amount} onValueChange={setAmount} ticker={stakeToken?.ticker} />
                            {receiveToken && (
                                <AmountReversed
                                    value={reversedAmount}
                                    ticker={receiveToken.ticker}
                                    decimals={receiveToken.decimals}
                                />
                            )}
                        </div>

                        <StakingBalanceBlock
                            direction="stake"
                            providerMetadata={providerMetadata}
                            stakedBalance={stakedBalance?.stakedBalance}
                            isStakedBalanceLoading={isStakedBalanceLoading}
                            balance={balance}
                            isBalanceLoading={isBalanceLoading}
                            onMaxClick={onMaxClick}
                        />

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
                                ticker={!isReversed && receiveToken ? receiveToken.ticker : stakeToken?.ticker}
                            />
                            {receiveToken && (
                                <AmountReversed
                                    value={reversedAmount}
                                    ticker={isReversed ? receiveToken.ticker : (stakeToken?.ticker ?? '')}
                                    decimals={isReversed ? receiveToken.decimals : stakeToken?.decimals}
                                    onChangeDirection={
                                        providerMetadata?.supportsReversedQuote ? toggleReversed : undefined
                                    }
                                />
                            )}
                        </div>

                        <StakingBalanceBlock
                            direction="unstake"
                            providerMetadata={providerMetadata}
                            stakedBalance={stakedBalance?.stakedBalance}
                            isStakedBalanceLoading={isStakedBalanceLoading}
                            balance={balance}
                            isBalanceLoading={isBalanceLoading}
                            onMaxClick={onMaxClick}
                        />

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
                />
            </Tabs>

            <LowBalanceModal
                open={isLowBalanceWarningOpen}
                mode={lowBalanceMode}
                requiredTon={lowBalanceRequiredTon}
                onChange={onLowBalanceChange}
                onCancel={onLowBalanceCancel}
            />
        </div>
    );
};
