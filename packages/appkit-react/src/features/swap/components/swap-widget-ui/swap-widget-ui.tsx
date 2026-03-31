/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { FC } from 'react';

import { Button } from '../../../../components/button';
import { useI18n } from '../../../settings/hooks/use-i18n';
import { useConnect, useConnectors } from '../../../wallets';
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

export type SwapWidgetRenderProps = SwapContextType;

export const SwapWidgetUI: FC<SwapWidgetRenderProps> = ({
    fromToken,
    toToken,
    tokens,
    fromAmount,
    toAmount,
    fromFiatValue,
    toFiatValue,
    fromBalance,
    toBalance,
    // fiatSymbol,
    isFlipped,
    canSubmit,
    isWalletConnected,
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
}) => {
    const connectors = useConnectors();
    const { mutate: connect, isPending: isConnecting } = useConnect();
    const { t } = useI18n();
    const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const provider = useSwapProvider({ id: quote?.providerId });
    const infoRows = getInfoFromQuote({ quote, slippage, provider, toToken, fromToken });

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <h2 className={styles.headerTitle}>{t('swap.title')}</h2>
                <SwapSettingsButton onClick={() => setIsSettingsOpen(true)} />
            </div>

            <div className={styles.fieldsContainer}>
                <SwapField
                    type="pay"
                    tokenSymbol={fromToken?.symbol ?? ''}
                    tokenIcon={fromToken?.logo}
                    amount={fromAmount}
                    onAmountChange={setFromAmount}
                    usdValue={fromFiatValue ?? undefined}
                    balance={fromBalance}
                    onMaxClick={onMaxClick}
                    onTokenSelectorClick={() => setActiveField('from')}
                />

                <div className={styles.flipButtonWrapper}>
                    <SwapFlipButton onClick={onFlip} rotated={isFlipped} />
                </div>

                <SwapField
                    type="receive"
                    tokenSymbol={toToken?.symbol ?? ''}
                    tokenIcon={toToken?.logo}
                    amount={toAmount}
                    usdValue={toFiatValue ?? undefined}
                    balance={toBalance}
                    onTokenSelectorClick={() => setActiveField('to')}
                    loading={isQuoteLoading}
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

            {infoRows.length > 0 && <SwapInfo rows={infoRows} />}

            {isWalletConnected ? (
                <Button
                    variant="fill"
                    size="l"
                    fullWidth
                    style={{ marginTop: '8px' }}
                    disabled={!canSubmit || isQuoteLoading || isSendingTransaction}
                    onClick={sendSwapTransaction}
                >
                    {error ? t(`swap.${error}`) : canSubmit ? t('swap.continue') : t('swap.enterAmount')}
                </Button>
            ) : (
                <Button
                    variant="fill"
                    size="l"
                    fullWidth
                    style={{ marginTop: '8px' }}
                    disabled={isConnecting || connectors.length === 0}
                    onClick={() => connectors[0] && connect({ connectorId: connectors[0].id })}
                >
                    {t('wallet.connectWallet')}
                </Button>
            )}
        </div>
    );
};
