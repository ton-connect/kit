/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useMemo, useState } from 'react';
import type { FC } from 'react';

import { Button } from '../../../../components/ui/button';
import { CenteredAmountInput } from '../../../../components/ui/centered-amount-input';
import { TokenSelector } from '../../../../components/shared/token-selector';
import type { AppkitUIToken } from '../../../../types/appkit-ui-token';
import { TokenSelectModal } from '../../../../components/shared/token-select-modal';
import type { TokenSectionConfig } from '../../../../components/shared/token-select-modal';
import { useConnectedWallets } from '../../../wallets/hooks/use-connected-wallets';
import { useI18n } from '../../../settings/hooks/use-i18n';
import { OnrampCurrencySelectModal } from '../../components/onramp-currency-select-modal';
import { ONRAMP_CURRENCIES } from '../../mock-data/currencies';
import type { OnrampAmountPreset, OnrampCurrency, CurrencySectionConfig } from '../../types';
import styles from './ton-pay-widget.module.css';
import { AmountPresets } from '../../../../components/shared/amount-presets';

const TON_PAY_API_URL = 'https://testnet.pay.ton.org/api/merchant/v1/create-moonpay-transfer';
const SUPPORTED_ASSETS = ['TON', 'USDT'] as const;

const DEFAULT_CURRENCIES: OnrampCurrency[] = ONRAMP_CURRENCIES.filter((c) => c.id === 'usd');

const DEFAULT_PRESET_AMOUNTS = ['50', '100', '250', '500'];

export interface TonPayWidgetProps {
    /** Tokens available to buy — only TON and USDT are supported by TonPay */
    tokens: AppkitUIToken[];
    /** Optional section configs for grouping tokens in the selector */
    tokenSections?: TokenSectionConfig[];
    /** Id of the token pre-selected for purchase */
    defaultTokenId?: string;
    /** Fiat currencies to show in the selector. Defaults to USD only. */
    currencies?: OnrampCurrency[];
    /** Optional section configs for grouping currencies in the selector */
    currencySections?: CurrencySectionConfig[];
    /** Id of the fiat currency pre-selected */
    defaultCurrencyId?: string;
    /** Pre-filled amount */
    defaultAmount?: string;
    /** Preset amount buttons (crypto amounts). Defaults to 50/100/250/500 with the token ticker. */
    presetAmounts?: OnrampAmountPreset[];
}

export const TonPayWidget: FC<TonPayWidgetProps> = ({
    tokens,
    tokenSections,
    defaultTokenId,
    currencies = DEFAULT_CURRENCIES,
    currencySections,
    defaultCurrencyId,
    defaultAmount = '',
    presetAmounts,
}) => {
    const { t } = useI18n();

    const supportedTokens = useMemo(
        () =>
            tokens.filter((token) =>
                SUPPORTED_ASSETS.includes(token.symbol.toUpperCase() as (typeof SUPPORTED_ASSETS)[number]),
            ),
        [tokens],
    );

    const [selectedToken, setSelectedToken] = useState<AppkitUIToken | null>(
        () => supportedTokens.find((t) => t.id === defaultTokenId) ?? supportedTokens[0] ?? null,
    );
    const [selectedCurrency, setSelectedCurrency] = useState<OnrampCurrency | null>(
        () => currencies.find((c) => c.id === defaultCurrencyId) ?? currencies[0] ?? null,
    );
    const [amount, setAmount] = useState(defaultAmount);
    const [isTokenSelectOpen, setIsTokenSelectOpen] = useState(false);
    const [isCurrencySelectOpen, setIsCurrencySelectOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wallets = useConnectedWallets();
    const activeWallet = wallets?.[0];

    const numericAmount = parseFloat(amount);
    const isAmountValid = !isNaN(numericAmount) && numericAmount > 0;
    const canContinue = isAmountValid && !!selectedToken && !!activeWallet && !isSubmitting;
    const isCurrencyReadOnly = currencies.length <= 1;
    const isTokenReadOnly = supportedTokens.length <= 1;

    const effectivePresets = useMemo<OnrampAmountPreset[]>(() => {
        if (presetAmounts) return presetAmounts;

        return DEFAULT_PRESET_AMOUNTS.map((amount) => ({
            amount,
            label: amount,
        }));
    }, [presetAmounts]);

    const handleContinue = useCallback(async () => {
        if (!canContinue || !selectedToken || !activeWallet) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(TON_PAY_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    asset: selectedToken.symbol.toUpperCase(),
                    amount: numericAmount,
                    recipientAddr: activeWallet.getAddress(),
                    directTopUp: true,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            if (!data.link) {
                throw new Error('Missing redirect URL');
            }

            window.open(data.link, '_blank');
        } catch {
            setError(t('onramp.tonPayError'));
        } finally {
            setIsSubmitting(false);
        }
    }, [canContinue, selectedToken, activeWallet, numericAmount, t]);

    const errorMessage = error ?? (!activeWallet ? t('onramp.connectWallet') : null);

    return (
        <div className={styles.widget}>
            <div className={styles.selectors}>
                <TokenSelector
                    size="m"
                    variant="secondary"
                    className={styles.selector}
                    title={t('onramp.buyToken', { symbol: selectedToken?.symbol ?? '' })}
                    icon={selectedToken?.logo}
                    readOnly={isTokenReadOnly}
                    onClick={() => setIsTokenSelectOpen(true)}
                />

                <TokenSelector
                    size="m"
                    variant="secondary"
                    className={styles.selector}
                    title={t('onramp.forCurrency', { symbol: selectedCurrency?.code ?? '' })}
                    icon={selectedCurrency?.logo}
                    readOnly={isCurrencyReadOnly}
                    onClick={() => setIsCurrencySelectOpen(true)}
                />
            </div>

            <CenteredAmountInput
                className={styles.input}
                value={amount}
                onValueChange={setAmount}
                ticker={selectedToken?.symbol}
            />

            <AmountPresets className={styles.presets} presets={effectivePresets} onPresetSelect={setAmount} />

            <Button
                variant="fill"
                size="l"
                disabled={!canContinue}
                loading={isSubmitting}
                onClick={handleContinue}
                fullWidth
            >
                {t('onramp.continue')}
            </Button>

            {errorMessage && <div className={styles.error}>{errorMessage}</div>}

            {!isTokenReadOnly && (
                <TokenSelectModal
                    open={isTokenSelectOpen}
                    onClose={() => setIsTokenSelectOpen(false)}
                    tokens={supportedTokens}
                    tokenSections={tokenSections}
                    onSelect={setSelectedToken}
                    title={t('onramp.selectToken')}
                    searchPlaceholder={t('onramp.searchToken')}
                />
            )}

            {!isCurrencyReadOnly && (
                <OnrampCurrencySelectModal
                    open={isCurrencySelectOpen}
                    onClose={() => setIsCurrencySelectOpen(false)}
                    currencies={currencies}
                    currencySections={currencySections}
                    onSelect={setSelectedCurrency}
                />
            )}
        </div>
    );
};
