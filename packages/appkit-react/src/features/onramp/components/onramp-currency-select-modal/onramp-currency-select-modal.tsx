/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo, useState } from 'react';
import type { FC } from 'react';

import { CurrencySelect } from '../../../../components/shared/currency-select-modal';
import type { OnrampCurrency, CurrencySectionConfig } from '../../types';
import { OnrampCurrencyItem } from '../onramp-currency-item';
import { useI18n } from '../../../settings/hooks/use-i18n';
import { filterCurrencies, groupCurrencySections } from './utils';
import type { CurrencySection } from './utils';

/**
 * Props for `OnrampCurrencySelectModal`. Internal: TonPay / fiat onramp are not part of the public API yet.
 */
export interface OnrampCurrencySelectModalProps {
    /** Whether the modal is open. */
    open: boolean;
    /** Called when the modal requests to close (selection made or dismissed). */
    onClose: () => void;
    /** Full list of fiat currencies the user can pick from. */
    currencies: OnrampCurrency[];
    /** Optional section configs grouping `currencies` by id; ungrouped currencies fall under an "Other" section. */
    currencySections?: CurrencySectionConfig[];
    /** Called with the picked currency before the modal closes. */
    onSelect: (currency: OnrampCurrency) => void;
}

/**
 * Searchable modal listing fiat `OnrampCurrency` entries (optionally grouped into sections) — used by fiat onramp widgets to let users pick the fiat side of the trade. Internal: TonPay / fiat onramp are not part of the public API yet.
 */
export const OnrampCurrencySelectModal: FC<OnrampCurrencySelectModalProps> = ({
    open,
    onClose,
    currencies,
    currencySections,
    onSelect,
}) => {
    const { t } = useI18n();
    const [search, setSearch] = useState('');

    const displaySections = useMemo((): CurrencySection[] => {
        if (search) {
            return [{ title: '', currencies: filterCurrencies(currencies, search) }];
        }
        if (currencySections) {
            return groupCurrencySections(currencies, currencySections, t('tokenSelect.otherCurrencies'));
        }
        return [{ title: '', currencies }];
    }, [currencies, currencySections, search, t]);

    const isEmpty = displaySections.every((s) => s.currencies.length === 0);

    const handleSelect = (currency: OnrampCurrency) => () => {
        onSelect(currency);
        onClose();
        setSearch('');
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            onClose();
            setSearch('');
        }
    };

    return (
        <CurrencySelect.Modal open={open} onOpenChange={handleOpenChange} title={t('onramp.selectCurrency')}>
            <CurrencySelect.Search
                searchValue={search}
                onSearchChange={setSearch}
                placeholder={t('onramp.searchCurrency')}
            />

            <CurrencySelect.ListContainer isEmpty={isEmpty}>
                {displaySections.map((section) => (
                    <CurrencySelect.Section key={section.title}>
                        {section.title && <CurrencySelect.SectionHeader>{section.title}</CurrencySelect.SectionHeader>}
                        {section.currencies.map((currency) => (
                            <OnrampCurrencyItem
                                key={currency.code}
                                currency={currency}
                                onClick={handleSelect(currency)}
                            />
                        ))}
                    </CurrencySelect.Section>
                ))}
            </CurrencySelect.ListContainer>
        </CurrencySelect.Modal>
    );
};
