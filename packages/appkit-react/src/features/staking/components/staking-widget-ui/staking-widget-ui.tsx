/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo, useState } from 'react';
import type { ComponentProps, FC, ReactNode } from 'react';
import type { StakingQuoteDirection } from '@ton/appkit';
import clsx from 'clsx';

import { CenteredAmountInput } from '../../../../components/ui/centered-amount-input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs';
import { useI18n } from '../../../settings/hooks/use-i18n';
import { StakingBalanceBlock } from '../staking-balance-block';
import { StakingInfo } from '../staking-info';
import { SelectUnstakeMode } from '../select-unstake-mode';
import { StakingSettingsModal } from '../staking-settings-modal';
import styles from './staking-widget-ui.module.css';
import type { StakingContextType } from '../staking-widget-provider';
import { ButtonWithConnect } from '../../../../components/shared/button-with-connect';
import { AmountReversed } from '../../../../components/ui/amount-reversed';
import { LowBalanceModal } from '../../../../components/shared/low-balance-modal';
import { SettingsButton } from '../../../../components/shared/settings-button';

/**
 * Props accepted by {@link StakingWidgetUI} (also the argument type for the `StakingWidget` render-prop). Combines the full {@link StakingContextType} with standard `<div>` props forwarded to the outer wrapper.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type StakingWidgetRenderProps = StakingContextType & ComponentProps<'div'>;

/**
 * Default staking-widget UI. Renders a stake/unstake tabbed layout: a centered amount input with optional reversed input, a {@link StakingBalanceBlock} for the relevant balance, the submit button (wired through `ButtonWithConnect` so a disconnected user is prompted to connect first), a settings button that opens {@link StakingSettingsModal}, the unstake-mode picker ({@link SelectUnstakeMode}, unstake tab only), and a {@link StakingInfo} summary. A {@link LowBalanceModal} surfaces when the built transaction would exceed the user's TON balance. All state is consumed from props (typically supplied by {@link StakingWidgetProvider}); this component owns only the local `settings modal open` flag.
 *
 * @public
 * @category Component
 * @section Staking
 */
export const StakingWidgetUI: FC<StakingWidgetRenderProps> = ({
    amount,
    canSubmit,
    isQuoteLoading,
    error,
    providerInfo,
    providerMetadata,
    stakingProvider,
    stakingProviders,
    setStakingProviderId,
    network,
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

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const receiveToken = providerMetadata?.receiveToken;
    const stakeToken = providerMetadata?.stakeToken;

    const buttonText = useMemo(() => {
        if (error) return t(error);
        return direction === 'stake' ? t('staking.continue') : t('staking.unstake');
    }, [error, direction, t]);

    const submitActions: ReactNode = (
        <div className={styles.actions}>
            <ButtonWithConnect
                variant="fill"
                size="l"
                fullWidth
                disabled={!canSubmit || isQuoteLoading || isSendingTransaction}
                onClick={sendTransaction}
            >
                {buttonText}
            </ButtonWithConnect>
            <SettingsButton onClick={() => setIsSettingsOpen(true)} />
        </div>
    );

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

                        {submitActions}
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

                        {submitActions}

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

            <StakingSettingsModal
                open={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                provider={stakingProvider}
                providers={stakingProviders}
                onProviderChange={setStakingProviderId}
                network={network}
            />
        </div>
    );
};
