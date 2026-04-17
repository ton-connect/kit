/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from 'react';
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
import styles from './swap-widget-ui.module.css';
import { getInfoFromQuote } from '../../utils/get-info-from-quote';
import type { SwapContextType } from '../swap-widget-provider';
import { useSwapProvider } from '../../hooks/use-swap-provider';
import { ButtonWithConnect } from '../../../../components/button-with-connect';

export type SwapWidgetRenderProps = SwapContextType & ComponentProps<'div'>;

export const SwapWidgetUI: FC<SwapWidgetRenderProps> = ({
    fromToken,
    toToken,
    tokens,
    fromAmount,
    toAmount,
    fromBalance,
    toBalance,
    canSubmit,
    quote,
    isQuoteLoading,
    error,
    slippage,
    onFlip,
    onMaxClick,
    setFromAmount,
    setFromToken,
    setToToken,
    setSlippage,
    sendSwapTransaction,
    isSendingTransaction,
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

    const provider = useSwapProvider({ id: quote?.providerId });
    const infoRows = getInfoFromQuote({ quote, slippage, provider, toToken });

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
                    onAmountChange={setFromAmount}
                    balance={fromBalance}
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
                    balance={toBalance}
                    onTokenSelectorClick={() => setActiveField('to')}
                    loading={isQuoteLoading}
                    isWalletConnected={isWalletConnected}
                />
            </div>

            <SwapTokenSelectModal
                open={activeField !== null}
                onClose={() => setActiveField(null)}
                tokens={tokens}
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
            />

            {fromAmount && <SwapInfo rows={infoRows} isLoading={isQuoteLoading || !quote || infoRows.length === 0} />}

            <ButtonWithConnect
                className={styles.swapButton}
                variant="fill"
                size="l"
                fullWidth
                disabled={!canSubmit || isQuoteLoading || isSendingTransaction}
                onClick={sendSwapTransaction}
            >
                {error ? t(`swap.${error}`) : canSubmit ? t('swap.continue') : t('swap.enterAmount')}
            </ButtonWithConnect>
        </div>
    );
};
