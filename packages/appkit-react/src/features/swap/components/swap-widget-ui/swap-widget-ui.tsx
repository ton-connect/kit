/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useMemo, useState } from 'react';
import type { FC, ComponentProps } from 'react';
import clsx from 'clsx';

import { useI18n } from '../../../settings/hooks/use-i18n';
import { useSelectedWallet } from '../../../wallets';
import { SwapField } from '../swap-field';
import { SwapFlipButton } from '../swap-flip-button';
import { SwapInfo } from '../swap-info';
import { SwapSettingsButton } from '../swap-settings-button';
import { SwapSettingsModal } from '../swap-settings-modal';
import { SwapTokenSelectModal } from '../swap-token-select-modal';
import { LowBalanceModal } from '../../../../components/low-balance-modal';
import styles from './swap-widget-ui.module.css';
import type { SwapContextType } from '../swap-widget-provider';
import { ButtonWithConnect } from '../../../../components/button-with-connect';

export type SwapWidgetRenderProps = SwapContextType & ComponentProps<'div'>;

export const SwapWidgetUI: FC<SwapWidgetRenderProps> = ({
    fromToken,
    toToken,
    tokens,
    tokenSections,
    fromAmount,
    toAmount,
    fiatSymbol,
    fromBalance,
    toBalance,
    isFromBalanceLoading,
    isToBalanceLoading,
    canSubmit,
    quote,
    isQuoteLoading,
    error,
    slippage,
    swapProvider,
    swapProviders,
    setSwapProviderId,
    onFlip,
    onMaxClick,
    setFromAmount,
    setFromToken,
    setToToken,
    setSlippage,
    sendSwapTransaction,
    isSendingTransaction,
    isLowBalanceWarningOpen,
    lowBalanceMode,
    lowBalanceRequiredTon,
    onLowBalanceChange,
    onLowBalanceCancel,
    className,
    ...props
}) => {
    const [wallet] = useSelectedWallet();
    const isWalletConnected = wallet !== null;

    const { t } = useI18n();

    const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleFlip = useCallback(() => {
        setIsFlipped((prev) => !prev);
        onFlip();
    }, [onFlip]);

    const buttonText = useMemo(() => {
        if (error) return t(error);
        if (!fromToken || !toToken) return t('swap.selectToken');
        if (canSubmit) return t('swap.continue');
        return t('swap.enterAmount');
    }, [error, fromToken, toToken, canSubmit, t]);

    return (
        <div className={clsx(styles.widget, className)} {...props}>
            <div className={styles.header}>
                <h2 className={styles.headerTitle}>{t('swap.title')}</h2>
                <SwapSettingsButton onClick={() => setIsSettingsOpen(true)} />
            </div>

            <div className={styles.fieldsContainer}>
                <SwapField
                    type="pay"
                    token={fromToken ?? undefined}
                    amount={fromAmount}
                    fiatSymbol={fiatSymbol}
                    onAmountChange={setFromAmount}
                    balance={fromBalance}
                    isBalanceLoading={isFromBalanceLoading}
                    onMaxClick={onMaxClick}
                    onTokenSelectorClick={() => setActiveField('from')}
                    isWalletConnected={isWalletConnected}
                />

                <div className={styles.flipButtonWrapper}>
                    <SwapFlipButton onClick={handleFlip} rotated={isFlipped} />
                </div>

                <SwapField
                    type="receive"
                    token={toToken ?? undefined}
                    amount={toAmount}
                    fiatSymbol={fiatSymbol}
                    balance={toBalance}
                    isBalanceLoading={isToBalanceLoading}
                    onTokenSelectorClick={() => setActiveField('to')}
                    loading={isQuoteLoading}
                    isWalletConnected={isWalletConnected}
                />
            </div>

            <SwapTokenSelectModal
                open={activeField !== null}
                onClose={() => setActiveField(null)}
                tokens={tokens}
                tokenSections={tokenSections}
                onSelect={(token) => {
                    if (activeField === 'from') setFromToken(token);
                    else setToToken(token);
                }}
            />

            <SwapSettingsModal
                open={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                slippage={slippage}
                onSlippageChange={setSlippage}
                provider={swapProvider}
                providers={swapProviders}
                onProviderChange={setSwapProviderId}
            />

            <LowBalanceModal
                open={isLowBalanceWarningOpen}
                mode={lowBalanceMode}
                requiredTon={lowBalanceRequiredTon}
                onChange={onLowBalanceChange}
                onCancel={onLowBalanceCancel}
            />

            <ButtonWithConnect
                className={styles.swapButton}
                variant="fill"
                size="l"
                fullWidth
                disabled={!canSubmit || isQuoteLoading || isSendingTransaction}
                onClick={sendSwapTransaction}
            >
                {buttonText}
            </ButtonWithConnect>

            <SwapInfo
                quote={quote}
                provider={swapProvider}
                toToken={toToken}
                slippage={slippage}
                isQuoteLoading={isQuoteLoading}
            />
        </div>
    );
};
