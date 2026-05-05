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

import { ButtonWithConnect } from '../../../../../components/button-with-connect';
import { OnrampTokenSelectors } from '../../../components/onramp-token-selectors';
import { CenteredAmountInput } from '../../../../../components/centered-amount-input';
import { AmountPresets } from '../../../../../components/amount-presets';
import { TokenSelectModal } from '../../../../../components/token-select-modal';
import { AmountReversed } from '../../../../../components/amount-reversed';
import { CryptoMethodSelectModal } from '../crypto-method-select-modal';
import { CryptoOnrampDepositModal } from '../crypto-onramp-deposit-modal';
import { CryptoOnrampRefundAddressModal } from '../crypto-onramp-refund-address-modal';
import { CryptoOnrampInfoBlock } from '../crypto-onramp-info-block';
import type { CryptoOnrampContextType } from '../crypto-onramp-widget-provider';
import { useI18n } from '../../../../settings/hooks/use-i18n';
import styles from './crypto-onramp-widget-ui.module.css';

export type CryptoOnrampWidgetRenderProps = CryptoOnrampContextType &
    Omit<ComponentProps<'div'>, keyof CryptoOnrampContextType>;

export const CryptoOnrampWidgetUI: FC<CryptoOnrampWidgetRenderProps> = ({
    tokens,
    tokenSections,
    selectedToken,
    setSelectedToken,
    paymentMethods,
    methodSections,
    selectedMethod,
    setSelectedMethod,
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
                    networkLogoSrc: selectedMethod.networkLogo,
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

            <CryptoOnrampInfoBlock
                className={styles.info}
                selectedToken={selectedToken}
                tokenAmount={amountInputMode === 'token' ? amount : convertedAmount}
                isLoadingQuote={isLoadingQuote}
                isWalletConnected={isWalletConnected}
                targetBalance={targetBalance}
                isLoadingTargetBalance={isLoadingTargetBalance}
                quoteProviderName={quoteProviderName}
            />

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
                networkWarning={deposit?.networkWarning}
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
