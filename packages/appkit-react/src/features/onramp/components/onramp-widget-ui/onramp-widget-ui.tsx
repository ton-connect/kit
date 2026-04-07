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
import { OnrampAmountInput } from '../onramp-amount-input';
import { OnrampAmountPresets } from '../onramp-amount-presets';
import { OnrampTokenSelectModal } from '../onramp-token-select-modal';
import { OnrampCurrencySelectModal } from '../onramp-currency-select-modal';
import { OnrampProviderSelect } from '../onramp-provider-select';
import { OnrampCheckout } from '../onramp-checkout';
import styles from './onramp-widget-ui.module.css';

export type OnrampWidgetRenderProps = OnrampContextType;

export const OnrampWidgetUI: FC<OnrampWidgetRenderProps> = ({
    tokens,
    selectedToken,
    setSelectedToken,
    currencies,
    selectedCurrency,
    setSelectedCurrency,
    amount,
    setAmount,
    amountInputMode,
    // setAmountInputMode,
    convertedAmount,
    presetAmounts,
    setPresetAmount,
    providers,
    selectedProvider,
    setSelectedProvider,
    canContinue,
    error,
    isPurchasing,
    onPurchase,
}) => {
    const [isTokenSelectOpen, setIsTokenSelectOpen] = useState(false);
    const [isCurrencySelectOpen, setIsCurrencySelectOpen] = useState(false);
    const [isProviderSelectOpen, setIsProviderSelectOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    const convertedSymbol = amountInputMode === 'token' ? selectedCurrency.symbol : (selectedToken?.symbol ?? '');

    const handleContinue = useCallback(() => {
        if (selectedProvider) {
            setIsCheckoutOpen(true);
        } else {
            setIsProviderSelectOpen(true);
        }
    }, [selectedProvider]);

    const handleProviderSelected = useCallback(
        (provider: typeof selectedProvider) => {
            if (provider) {
                setSelectedProvider(provider);
                setIsCheckoutOpen(true);
            }
        },
        [setSelectedProvider],
    );

    const fiatAmount = amountInputMode === 'token' ? convertedAmount : amount;

    return (
        <div className={styles.widget}>
            <div className={styles.tabsRow}>
                <OnrampTokenSelectors
                    from={{ title: selectedToken?.symbol ?? '', logoSrc: selectedToken?.logo }}
                    to={{ title: selectedCurrency.code, logoSrc: selectedCurrency.flag }}
                    onFromClick={() => setIsTokenSelectOpen(true)}
                    onToClick={() => setIsCurrencySelectOpen(true)}
                />
            </div>

            <OnrampAmountInput
                value={amount}
                onChange={setAmount}
                ticker={amountInputMode === 'token' ? selectedToken?.symbol : undefined}
                symbol={amountInputMode === 'token' ? undefined : selectedCurrency.symbol}
            />

            <div className={styles.convertedLine}>
                {error === 'noQuotesFound' ? (
                    <span className={styles.error}>No quotes found</span>
                ) : (
                    convertedAmount && `${convertedSymbol} ${convertedAmount}`
                )}
            </div>

            <OnrampAmountPresets
                presets={presetAmounts}
                currencySymbol={selectedCurrency.symbol}
                onSelect={setPresetAmount}
            />

            <Button variant="fill" size="l" fullWidth disabled={!canContinue} onClick={handleContinue}>
                {error ? 'No quotes found' : canContinue ? 'Continue' : 'Enter an amount'}
            </Button>

            <OnrampTokenSelectModal
                open={isTokenSelectOpen}
                onClose={() => setIsTokenSelectOpen(false)}
                tokens={tokens}
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

            <OnrampCheckout
                open={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                token={selectedToken}
                amount={amountInputMode === 'token' ? amount : convertedAmount}
                fiatAmount={fiatAmount}
                fiatSymbol={selectedCurrency.symbol}
                provider={selectedProvider}
                isPurchasing={isPurchasing}
                onConfirm={onPurchase}
            />
        </div>
    );
};
