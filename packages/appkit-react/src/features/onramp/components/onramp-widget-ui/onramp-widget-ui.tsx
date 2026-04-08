/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from 'react';
import type { FC } from 'react';

import { Button } from '../../../../components/button';
import type { OnrampContextType } from '../onramp-widget-provider';
import { OnrampTokenSelectors } from '../onramp-token-selectors';
import { CenteredAmountInput } from '../../../../components/centered-amount-input';
import { OnrampAmountPresets } from '../onramp-amount-presets';
import { OnrampTokenSelectModal } from '../onramp-token-select-modal';
import { OnrampCurrencySelectModal } from '../onramp-currency-select-modal';
import { OnrampProviderSelect } from '../onramp-provider-select';
import styles from './onramp-widget-ui.module.css';
import { OnrampAmountReversed } from '../onramp-amount-reversed';
import type { OnrampProvider } from '../../types';
import { useI18n } from '../../../settings/hooks/use-i18n';

export type OnrampWidgetRenderProps = OnrampContextType;

export const OnrampWidgetUI: FC<OnrampWidgetRenderProps> = ({
    tokens,
    tokenSections,
    selectedToken,
    setSelectedToken,
    currencies,
    selectedCurrency,
    setSelectedCurrency,
    amount,
    setAmount,
    amountInputMode,
    setAmountInputMode,
    convertedAmount,
    presetAmounts,
    providers,
    canContinue,
    error,
    onReset,
}) => {
    const { t } = useI18n();
    const [isTokenSelectOpen, setIsTokenSelectOpen] = useState(false);

    const [isCurrencySelectOpen, setIsCurrencySelectOpen] = useState(false);
    const [isProviderSelectOpen, setIsProviderSelectOpen] = useState(false);

    const handleContinue = useCallback(() => {
        setIsProviderSelectOpen(true);
    }, []);

    const handleProviderSelected = useCallback(
        (_provider: OnrampProvider) => {
            onReset();
        },
        [onReset],
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

            <CenteredAmountInput
                className={styles.input}
                value={amount}
                onValueChange={setAmount}
                ticker={amountInputMode === 'token' ? selectedToken?.symbol : undefined}
                symbol={amountInputMode === 'token' ? undefined : selectedCurrency.symbol}
            />

            <OnrampAmountReversed
                className={styles.converted}
                value={convertedAmount}
                onChangeDirection={() => setAmountInputMode(amountInputMode === 'token' ? 'currency' : 'token')}
                ticker={amountInputMode === 'token' ? undefined : selectedToken?.symbol}
                symbol={amountInputMode === 'token' ? selectedCurrency.symbol : undefined}
                errorMessage={error ? t(`onramp.${error}`) : undefined}
            />

            <OnrampAmountPresets
                className={styles.presets}
                presets={presetAmounts}
                currencySymbol={selectedCurrency.symbol}
                onPresetSelect={setAmount}
            />

            <Button variant="fill" size="l" disabled={!canContinue} onClick={handleContinue} fullWidth>
                {t('onramp.continue')}
            </Button>

            <OnrampTokenSelectModal
                open={isTokenSelectOpen}
                onClose={() => setIsTokenSelectOpen(false)}
                tokens={tokens}
                tokenSections={tokenSections}
                onSelect={setSelectedToken}
            />

            <OnrampCurrencySelectModal
                open={isCurrencySelectOpen}
                onClose={() => setIsCurrencySelectOpen(false)}
                currencies={currencies}
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
