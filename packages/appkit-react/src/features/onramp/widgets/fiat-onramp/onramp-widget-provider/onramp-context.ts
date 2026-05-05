/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useContext } from 'react';
import type { OnrampQuote } from '@ton/appkit/onramp';

import type { TokenSectionConfig } from '../../../../../components/token-select-modal';
import type { AppkitUIToken } from '../../../../../types/appkit-ui-token';
import { ONRAMP_CURRENCIES } from '../../../mock-data/currencies';
import { DEFAULT_ONRAMP_PRESETS } from '../../../constants';
import type {
    OnrampCurrency,
    OnrampProvider as OnrampWidgetProviderType,
    AmountInputMode,
    OnrampAmountPreset,
    CurrencySectionConfig,
} from '../../../types';

export interface OnrampContextType {
    /** Full list of available tokens to buy */
    tokens: AppkitUIToken[];
    /** Optional section configs for grouping tokens in the selector */
    tokenSections?: TokenSectionConfig[];
    /** Currently selected token to buy */
    selectedToken: AppkitUIToken | null;
    setSelectedToken: (token: AppkitUIToken) => void;

    /** Available fiat currencies */
    currencies: OnrampCurrency[];
    /** Optional section configs for grouping currencies */
    currencySections?: CurrencySectionConfig[];
    /** Currently selected fiat currency */
    selectedCurrency: OnrampCurrency;
    setSelectedCurrency: (currency: OnrampCurrency) => void;

    /** Current amount input value */
    amount: string;
    setAmount: (value: string) => void;
    /** Whether user is entering token amount or fiat amount */
    amountInputMode: AmountInputMode;
    setAmountInputMode: (mode: AmountInputMode) => void;
    /** Converted amount in the opposite denomination (from the selected quote) */
    convertedAmount: string;
    /** Preset amount values */
    presetAmounts: OnrampAmountPreset[];

    /** Available payment providers (derived from received quotes) */
    providers: OnrampWidgetProviderType[];
    /** Currently selected payment provider */
    selectedProvider: OnrampWidgetProviderType | null;
    setSelectedProvider: (provider: OnrampWidgetProviderType) => void;
    /** Quote tied to the currently selected provider */
    selectedQuote?: OnrampQuote;
    /** Whether registered providers support reversed (crypto-amount) quotes */
    isReversedAmountSupported: boolean;

    /** Validation/fetch error i18n key, null when everything is ok */
    error: string | null;
    /** Whether quotes are being fetched */
    isLoadingQuote: boolean;
    /** Whether the user can proceed (valid amount + quote available + provider selected) */
    canSubmit: boolean;

    /** Reset widget to initial state */
    onReset: () => void;
    /** Execute the onramp (build URL and redirect) */
    onContinue: () => void;
}

const defaultContext: OnrampContextType = {
    tokens: [],
    tokenSections: undefined,
    selectedToken: null,
    setSelectedToken: () => {},
    currencies: [],
    currencySections: undefined,
    selectedCurrency: ONRAMP_CURRENCIES[0]!,
    setSelectedCurrency: () => {},
    amount: '',
    setAmount: () => {},
    amountInputMode: 'currency',
    setAmountInputMode: () => {},
    convertedAmount: '',
    presetAmounts: DEFAULT_ONRAMP_PRESETS,
    providers: [],
    selectedProvider: null,
    setSelectedProvider: () => {},
    selectedQuote: undefined,
    isReversedAmountSupported: false,
    error: null,
    isLoadingQuote: false,
    canSubmit: false,
    onReset: () => {},
    onContinue: () => {},
};

export const OnrampContext = createContext<OnrampContextType>(defaultContext);

export const useOnrampContext = (): OnrampContextType => {
    return useContext(OnrampContext);
};
