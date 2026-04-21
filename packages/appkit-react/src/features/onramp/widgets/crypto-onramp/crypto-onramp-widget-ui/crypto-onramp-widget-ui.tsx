/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useEffect, useState } from 'react';
import type { FC } from 'react';
import { formatLargeValue, truncateDecimals } from '@ton/appkit';

import { ButtonWithConnect } from '../../../../../components/button-with-connect';
import { OnrampTokenSelectors } from '../../../components/onramp-token-selectors';
import { CenteredAmountInput } from '../../../../../components/centered-amount-input';
import { AmountPresets } from '../../../../../components/amount-presets';
import { OnrampTokenSelectModal } from '../../../components/onramp-token-select-modal';
import { OnrampAmountReversed } from '../../../components/onramp-amount-reversed';
import { CryptoMethodSelectModal } from '../crypto-method-select-modal';
import { CryptoOnrampDepositModal } from '../crypto-onramp-deposit-modal';
import { InfoBlock } from '../../../../../components/info-block';
import type { CryptoOnrampContextType } from '../crypto-onramp-widget-provider';
import { useI18n } from '../../../../settings/hooks/use-i18n';
import styles from './crypto-onramp-widget-ui.module.css';

export type CryptoOnrampWidgetRenderProps = CryptoOnrampContextType;

const formatAmount = (amount?: string, decimals?: number) => {
    const trimmed = truncateDecimals(amount || '0', Math.min(5, decimals || 9));

    return formatLargeValue(trimmed, decimals);
};

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
    createDeposit,
    isCreatingDeposit,
    deposit,
    depositAmount,
    isWalletConnected,
    canContinue,
    error,
}) => {
    const { t } = useI18n();
    const [isTokenSelectOpen, setIsTokenSelectOpen] = useState(false);
    const [isMethodSelectOpen, setIsMethodSelectOpen] = useState(false);
    const [isDepositOpen, setIsDepositOpen] = useState(false);

    useEffect(() => {
        if (deposit) {
            setIsDepositOpen(true);
        }
    }, [deposit]);

    const handleContinue = useCallback(() => {
        createDeposit();
    }, [createDeposit]);

    const handleDepositClose = useCallback(() => {
        setIsDepositOpen(false);
    }, []);

    return (
        <div className={styles.widget}>
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

                <OnrampAmountReversed
                    className={styles.converted}
                    value={convertedAmount}
                    onChangeDirection={() => setAmountInputMode(amountInputMode === 'token' ? 'method' : 'token')}
                    ticker={amountInputMode === 'token' ? selectedMethod.symbol : selectedToken?.symbol}
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
                {error ? t(`cryptoOnramp.${error}`) : t('cryptoOnramp.continue')}
            </ButtonWithConnect>

            <InfoBlock.Container className={styles.info}>
                <InfoBlock.Row>
                    <InfoBlock.Label>{t('cryptoOnramp.youGet')}</InfoBlock.Label>

                    {isLoadingQuote ? (
                        <InfoBlock.ValueSkeleton />
                    ) : (
                        <InfoBlock.Value>
                            {formatAmount(
                                amountInputMode === 'token' ? amount : convertedAmount,
                                selectedToken?.decimals,
                            )}{' '}
                            {selectedToken?.symbol}
                        </InfoBlock.Value>
                    )}
                </InfoBlock.Row>

                <InfoBlock.Row>
                    <InfoBlock.Label>{t('cryptoOnramp.exchangeRate')}</InfoBlock.Label>

                    {isLoadingQuote ? (
                        <InfoBlock.ValueSkeleton />
                    ) : (
                        <InfoBlock.Value>
                            1 {selectedToken?.symbol} ={' '}
                            {formatAmount(quote ? (1 / parseFloat(quote.rate)).toString() : '0', 2)}{' '}
                            {selectedMethod.symbol}
                        </InfoBlock.Value>
                    )}
                </InfoBlock.Row>
            </InfoBlock.Container>

            <OnrampTokenSelectModal
                open={isTokenSelectOpen}
                onClose={() => setIsTokenSelectOpen(false)}
                tokens={tokens}
                tokenSections={tokenSections}
                onSelect={setSelectedToken}
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
                symbol={deposit?.sourceCurrency ?? selectedMethod.symbol}
                memo={deposit?.memo}
                tokenLogo={selectedMethod.logo}
                networkWarning={deposit?.networkWarning}
            />
        </div>
    );
};
