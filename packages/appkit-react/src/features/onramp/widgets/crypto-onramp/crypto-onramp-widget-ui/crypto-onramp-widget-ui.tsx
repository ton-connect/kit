/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from 'react';
import type { FC } from 'react';

import { Button } from '../../../../../components/button';
import { OnrampTokenSelectors } from '../../../components/onramp-token-selectors';
import { CenteredAmountInput } from '../../../../../components/centered-amount-input';
import { OnrampAmountPresets } from '../../../components/onramp-amount-presets';
import { OnrampTokenSelectModal } from '../../../components/onramp-token-select-modal';
import { OnrampAmountReversed } from '../../../components/onramp-amount-reversed';
import { CryptoMethodSelectModal } from '../crypto-method-select-modal';
import { CryptoOnrampDepositModal } from '../crypto-onramp-deposit-modal';
import type { CryptoOnrampContextType } from '../crypto-onramp-widget-provider';
import { useI18n } from '../../../../settings/hooks/use-i18n';
import styles from './crypto-onramp-widget-ui.module.css';

export type CryptoOnrampWidgetRenderProps = CryptoOnrampContextType;

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
    canContinue,
    error,
    onReset,
}) => {
    const { t } = useI18n();
    const [isTokenSelectOpen, setIsTokenSelectOpen] = useState(false);
    const [isMethodSelectOpen, setIsMethodSelectOpen] = useState(false);
    const [isDepositOpen, setIsDepositOpen] = useState(false);

    const handleContinue = useCallback(() => {
        setIsDepositOpen(true);
    }, []);

    const handleDepositClose = useCallback(() => {
        setIsDepositOpen(false);
        onReset();
    }, [onReset]);

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

            <CenteredAmountInput
                className={styles.input}
                value={amount}
                onValueChange={setAmount}
                ticker={amountInputMode === 'token' ? selectedToken?.symbol : selectedMethod.symbol}
            />

            <OnrampAmountReversed
                className={styles.converted}
                value={convertedAmount}
                onChangeDirection={() => setAmountInputMode(amountInputMode === 'token' ? 'method' : 'token')}
                ticker={amountInputMode === 'token' ? selectedMethod.symbol : selectedToken?.symbol}
                errorMessage={error ? t(`onramp.${error}`) : undefined}
            />

            <OnrampAmountPresets className={styles.presets} presets={presetAmounts} onPresetSelect={setAmount} />

            <Button variant="fill" size="l" disabled={!canContinue} onClick={handleContinue} fullWidth>
                {t('cryptoOnramp.continue')}
            </Button>

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
                address={selectedMethod.depositAddress ?? ''}
                amount={amount}
                symbol={selectedMethod.symbol}
                tokenLogo={selectedMethod.logo}
            />
        </div>
    );
};
