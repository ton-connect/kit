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
import type { OnrampContextType } from '../onramp-widget-provider';
import { OnrampTokenSelectors } from '../../../components/onramp-token-selectors';
import { CenteredAmountInput } from '../../../../../components/centered-amount-input';
import { AmountPresets } from '../../../../../components/amount-presets';
import { TokenSelectModal } from '../../../../../components/token-select-modal';
import { OnrampCurrencySelectModal } from '../../../components/onramp-currency-select-modal';
import { OnrampProviderSelect } from '../../../components/onramp-provider-select';
import { OnrampInfoBlock } from '../onramp-info-block';
import styles from './onramp-widget-ui.module.css';
import { OnrampAmountReversed } from '../../../components/onramp-amount-reversed';
import type { OnrampProvider } from '../../../types';
import { useI18n } from '../../../../settings/hooks/use-i18n';

export type OnrampWidgetRenderProps = OnrampContextType;

export const OnrampWidgetUI: FC<OnrampWidgetRenderProps> = ({
    tokens,
    tokenSections,
    selectedToken,
    setSelectedToken,
    currencies,
    currencySections,
    selectedCurrency,
    setSelectedCurrency,
    amount,
    setAmount,
    amountInputMode,
    setAmountInputMode,
    convertedAmount,
    presetAmounts,
    providers,
    selectedQuote,
    isReversedAmountSupported,
    canSubmit,
    error,
    isLoadingQuote,
    onContinue,
    setSelectedProvider,
}) => {
    const { t } = useI18n();
    const [isTokenSelectOpen, setIsTokenSelectOpen] = useState(false);

    const [isCurrencySelectOpen, setIsCurrencySelectOpen] = useState(false);
    const [isProviderSelectOpen, setIsProviderSelectOpen] = useState(false);

    const handleContinue = useCallback(() => {
        setIsProviderSelectOpen(true);
    }, []);

    const handleProviderSelected = useCallback(
        (provider: OnrampProvider) => {
            setSelectedProvider(provider);
            // We give it a small timeout or wait for state update to ensure
            // the buildOnrampUrl uses the correct providerId if it's derived from state.
            // In our provider, buildOnrampUrl uses selectedProvider.id from state.
            setTimeout(() => {
                onContinue();
                setIsProviderSelectOpen(false);
            }, 0);
        },
        [onContinue, setSelectedProvider],
    );

    return (
        <div className={styles.widget}>
            <OnrampTokenSelectors
                className={styles.selectors}
                from={{ title: selectedToken?.symbol ?? '', logoSrc: selectedToken?.logo }}
                to={{ title: selectedCurrency.code, logoSrc: selectedCurrency.logo }}
                onFromClick={() => setIsTokenSelectOpen(true)}
                onToClick={() => setIsCurrencySelectOpen(true)}
            />

            <div className={styles.inputSection}>
                <CenteredAmountInput
                    value={amount}
                    onValueChange={setAmount}
                    ticker={amountInputMode === 'token' ? selectedToken?.symbol : undefined}
                    symbol={amountInputMode === 'token' ? undefined : selectedCurrency.symbol}
                />
                <OnrampAmountReversed
                    className={styles.converted}
                    value={convertedAmount}
                    onChangeDirection={
                        isReversedAmountSupported
                            ? () => setAmountInputMode(amountInputMode === 'token' ? 'currency' : 'token')
                            : undefined
                    }
                    ticker={amountInputMode === 'token' ? undefined : selectedToken?.symbol}
                    symbol={amountInputMode === 'token' ? selectedCurrency.symbol : undefined}
                    decimals={amountInputMode === 'token' ? 2 : (selectedToken?.decimals ?? 0)}
                />
            </div>

            <AmountPresets
                className={styles.presets}
                presets={presetAmounts}
                currencySymbol={selectedCurrency.symbol}
                onPresetSelect={(value) => {
                    setAmountInputMode('currency');
                    setAmount(value);
                }}
            />

            <Button
                variant="fill"
                size="l"
                disabled={!canSubmit}
                loading={isLoadingQuote}
                onClick={handleContinue}
                fullWidth
            >
                {error ? t(error) : t('onramp.continue')}
            </Button>

            <OnrampInfoBlock
                className={styles.info}
                selectedToken={selectedToken}
                selectedQuote={selectedQuote}
                isLoading={isLoadingQuote}
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

            <OnrampCurrencySelectModal
                open={isCurrencySelectOpen}
                onClose={() => setIsCurrencySelectOpen(false)}
                currencies={currencies}
                currencySections={currencySections}
                onSelect={setSelectedCurrency}
            />

            <OnrampProviderSelect
                open={isProviderSelectOpen}
                onClose={() => setIsProviderSelectOpen(false)}
                providers={providers}
                onSelect={handleProviderSelected}
            />
        </div>
    );
};
