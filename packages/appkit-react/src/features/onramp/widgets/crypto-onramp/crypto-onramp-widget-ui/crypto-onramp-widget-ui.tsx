/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useEffect, useState } from 'react';
import type { ComponentProps, FC } from 'react';
import clsx from 'clsx';

import { ButtonWithConnect } from '../../../../../components/shared/button-with-connect';
import { OnrampTokenSelectors } from '../../../components/onramp-token-selectors';
import { CenteredAmountInput } from '../../../../../components/ui/centered-amount-input';
import { AmountPresets } from '../../../../../components/shared/amount-presets';
import { TokenSelectModal } from '../../../../../components/shared/token-select-modal';
import { AmountReversed } from '../../../../../components/ui/amount-reversed';
import { CryptoMethodSelectModal } from '../crypto-method-select-modal';
import { CryptoOnrampDepositModal } from '../crypto-onramp-deposit-modal';
import { CryptoOnrampRefundAddressModal } from '../crypto-onramp-refund-address-modal';
import { InfoBlock } from '../../../../../components/ui/info-block';
import type { CryptoOnrampContextType } from '../crypto-onramp-widget-provider';
import { getChainInfo } from '../utils/chains';
import { formatOnrampAmount } from '../utils/format-onramp-amount';
import { useI18n } from '../../../../settings/hooks/use-i18n';
import styles from './crypto-onramp-widget-ui.module.css';

/**
 * Props for {@link CryptoOnrampWidgetUI} (and for the custom render callback on {@link CryptoOnrampWidget}) — the full {@link CryptoOnrampContextType} state and actions, plus the native `<div>` props the widget root forwards (`className`, `style`, etc.).
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type CryptoOnrampWidgetRenderProps = CryptoOnrampContextType &
    Omit<ComponentProps<'div'>, keyof CryptoOnrampContextType>;

/**
 * Presentational UI for the crypto-to-TON onramp widget — renders the from/to selectors, amount input with presets, continue button, info block (you-get / balance / provider) and the token-pick / method-pick / refund-address / deposit modals. All state and actions come from props ({@link CryptoOnrampWidgetRenderProps}); typically rendered inside {@link CryptoOnrampWidgetProvider} via {@link CryptoOnrampWidget}.
 *
 * @public
 * @category Component
 * @section Crypto Onramp
 */
export const CryptoOnrampWidgetUI: FC<CryptoOnrampWidgetRenderProps> = ({
    tokens,
    tokenSections,
    selectedToken,
    setSelectedToken,
    paymentMethods,
    methodSections,
    selectedMethod,
    setSelectedMethod,
    chains,
    amount,
    setAmount,
    amountInputMode,
    setAmountInputMode,
    convertedAmount,
    presetAmounts,
    quote,
    isLoadingQuote,
    quoteProviderName,
    createDeposit,
    isCreatingDeposit,
    deposit,
    depositAmount,
    isWalletConnected,
    canContinue,
    onReset,
    depositStatus,
    isRefundAddressRequired,
    isReversedAmountSupported,
    refundAddress,
    setRefundAddress,
    quoteError,
    depositError,
    targetBalance,
    isLoadingTargetBalance,
    className,
    ...props
}) => {
    const [isTokenSelectOpen, setIsTokenSelectOpen] = useState(false);
    const [isMethodSelectOpen, setIsMethodSelectOpen] = useState(false);
    const [isRefundAddressOpen, setIsRefundAddressOpen] = useState(false);
    const [isDepositOpen, setIsDepositOpen] = useState(false);

    const { t } = useI18n();

    const handleContinue = useCallback(() => {
        if (!isRefundAddressRequired) {
            createDeposit();
            return;
        }
        setIsRefundAddressOpen(true);
    }, [isRefundAddressRequired, createDeposit]);

    const handleConfirmRefundAddress = useCallback(() => {
        createDeposit();
    }, [createDeposit]);

    const handleDepositClose = useCallback(() => {
        setIsDepositOpen(false);
        onReset();
    }, [onReset]);

    const handleRefundAddressClose = useCallback(() => {
        setIsRefundAddressOpen(false);
        onReset();
    }, [onReset]);

    useEffect(() => {
        if (deposit) {
            setIsDepositOpen(true);
            setIsRefundAddressOpen(false);
        }
    }, [deposit]);

    return (
        <div className={clsx(styles.widget, className)} {...props}>
            <OnrampTokenSelectors
                className={styles.selectors}
                from={{ title: selectedToken?.symbol ?? '', logoSrc: selectedToken?.logo }}
                to={{
                    title: selectedMethod.symbol,
                    logoSrc: selectedMethod.logo,
                    networkLogoSrc: getChainInfo(selectedMethod.chain, chains).logo,
                }}
                onFromClick={() => setIsTokenSelectOpen(true)}
                onToClick={() => setIsMethodSelectOpen(true)}
            />

            <div className={styles.inputSection}>
                <CenteredAmountInput
                    className={styles.input}
                    value={amount}
                    onValueChange={setAmount}
                    disabled={!isWalletConnected}
                    ticker={amountInputMode === 'token' ? selectedToken?.symbol : selectedMethod.symbol}
                />

                <AmountReversed
                    className={styles.converted}
                    value={convertedAmount}
                    onChangeDirection={
                        isReversedAmountSupported
                            ? () => setAmountInputMode(amountInputMode === 'token' ? 'method' : 'token')
                            : undefined
                    }
                    ticker={amountInputMode === 'token' ? selectedMethod.symbol : selectedToken?.symbol}
                    decimals={amountInputMode === 'token' ? selectedMethod.decimals : (selectedToken?.decimals ?? 0)}
                />
            </div>

            <AmountPresets className={styles.presets} presets={presetAmounts} onPresetSelect={setAmount} />

            <ButtonWithConnect
                variant="fill"
                size="l"
                disabled={!canContinue || isCreatingDeposit}
                loading={isCreatingDeposit}
                onClick={handleContinue}
                fullWidth
            >
                {quoteError ? t(quoteError) : t('cryptoOnramp.continue')}
            </ButtonWithConnect>

            <InfoBlock.Container className={styles.info}>
                <InfoBlock.Row>
                    <InfoBlock.Label>{t('cryptoOnramp.youGet')}</InfoBlock.Label>

                    {isLoadingQuote ? (
                        <InfoBlock.ValueSkeleton />
                    ) : (
                        <InfoBlock.Value>
                            {formatOnrampAmount(
                                amountInputMode === 'token' ? amount : convertedAmount,
                                selectedToken?.decimals,
                            )}{' '}
                            {selectedToken?.symbol}
                        </InfoBlock.Value>
                    )}
                </InfoBlock.Row>

                {/*<InfoBlock.Row>
                    <InfoBlock.Label>{t('cryptoOnramp.exchangeRate')}</InfoBlock.Label>

                    {isLoadingQuote ? (
                        <InfoBlock.ValueSkeleton />
                    ) : (
                        <InfoBlock.Value>
                            1 {selectedToken?.symbol} ={' '}
                            {formatOnrampAmount(quote ? (1 / parseFloat(quote.rate)).toString() : '0', 2)}{' '}
                            {selectedMethod.symbol}
                        </InfoBlock.Value>
                    )}
                </InfoBlock.Row>*/}

                {isWalletConnected && (
                    <InfoBlock.Row>
                        <InfoBlock.Label>{t('cryptoOnramp.yourBalance')}</InfoBlock.Label>

                        {isLoadingTargetBalance ? (
                            <InfoBlock.ValueSkeleton />
                        ) : (
                            <InfoBlock.Value>
                                {formatOnrampAmount(targetBalance || '0', selectedToken?.decimals)}{' '}
                                {selectedToken?.symbol}
                            </InfoBlock.Value>
                        )}
                    </InfoBlock.Row>
                )}

                <InfoBlock.Row>
                    <InfoBlock.Label>{t('cryptoOnramp.provider')}</InfoBlock.Label>
                    {isLoadingQuote || !quoteProviderName ? (
                        <InfoBlock.ValueSkeleton />
                    ) : (
                        <InfoBlock.Value>{quoteProviderName}</InfoBlock.Value>
                    )}
                </InfoBlock.Row>
            </InfoBlock.Container>

            <TokenSelectModal
                open={isTokenSelectOpen}
                onClose={() => setIsTokenSelectOpen(false)}
                tokens={tokens}
                tokenSections={tokenSections}
                onSelect={setSelectedToken}
                title={t('onramp.selectToken')}
                searchPlaceholder={t('onramp.searchToken')}
            />

            <CryptoMethodSelectModal
                open={isMethodSelectOpen}
                onClose={() => setIsMethodSelectOpen(false)}
                methods={paymentMethods}
                methodSections={methodSections}
                chains={chains}
                onSelect={setSelectedMethod}
            />

            <CryptoOnrampDepositModal
                open={isDepositOpen}
                onClose={handleDepositClose}
                address={deposit?.address ?? ''}
                amount={depositAmount}
                symbol={selectedMethod.symbol}
                memo={deposit?.memo}
                tokenLogo={selectedMethod.logo}
                chainWarning={deposit?.chainWarning}
                depositStatus={depositStatus}
                targetSymbol={selectedToken?.symbol ?? ''}
                targetBalance={targetBalance}
                targetDecimals={selectedToken?.decimals}
                isLoadingTargetBalance={isLoadingTargetBalance}
            />

            <CryptoOnrampRefundAddressModal
                open={isRefundAddressOpen}
                onClose={handleRefundAddressClose}
                value={refundAddress}
                onChange={setRefundAddress}
                onConfirm={handleConfirmRefundAddress}
                isLoading={isCreatingDeposit}
                error={depositError ? t(depositError) : null}
            />
        </div>
    );
};
