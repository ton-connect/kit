/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo, useState } from 'react';
import type { FC } from 'react';

import { CurrencySelect } from '../../../../../components/currency-select-modal';
import { LogoWithNetwork } from '../../../../../components/logo-with-network';
import { CurrencyItem } from '../../../../../components/currency-item';
import type { CryptoPaymentMethod, PaymentMethodSectionConfig } from '../../../types';
import { useI18n } from '../../../../settings/hooks/use-i18n';
import type { ChainInfo } from '../utils/chains';
import { getChainInfo } from '../utils/chains';

export interface CryptoMethodSelectModalProps {
    open: boolean;
    onClose: () => void;
    methods: CryptoPaymentMethod[];
    methodSections?: PaymentMethodSectionConfig[];
    /** CAIP-2 → display info map. Defaults to `{}` (helper falls back to the chain reference). */
    chains?: Record<string, ChainInfo>;
    onSelect: (method: CryptoPaymentMethod) => void;
}

interface MethodSection {
    title: string;
    methods: CryptoPaymentMethod[];
}

const filterMethods = (
    methods: CryptoPaymentMethod[],
    search: string,
    chains: Record<string, ChainInfo>,
): CryptoPaymentMethod[] => {
    const q = search.toLowerCase();
    return methods.filter(
        (m) =>
            m.symbol.toLowerCase().includes(q) ||
            m.name.toLowerCase().includes(q) ||
            getChainInfo(m.chain, chains).name.toLowerCase().includes(q),
    );
};

const groupMethodSections = (
    methods: CryptoPaymentMethod[],
    sections: PaymentMethodSectionConfig[],
    otherTitle: string,
): MethodSection[] => {
    const idsSeen = new Set<string>();
    const result: MethodSection[] = sections.map((sec) => {
        const sectionMethods = sec.ids.flatMap((id) => {
            const m = methods.find((item) => item.id === id);
            if (!m) return [];
            idsSeen.add(m.id);
            return [m];
        });
        return { title: sec.title, methods: sectionMethods };
    });

    const others = methods.filter((m) => !idsSeen.has(m.id));
    if (others.length > 0) {
        result.push({ title: otherTitle, methods: others });
    }

    return result;
};

export const CryptoMethodSelectModal: FC<CryptoMethodSelectModalProps> = ({
    open,
    onClose,
    methods,
    methodSections,
    chains = {},
    onSelect,
}) => {
    const { t } = useI18n();
    const [search, setSearch] = useState('');

    const displaySections = useMemo((): MethodSection[] => {
        if (search) {
            return [{ title: '', methods: filterMethods(methods, search, chains) }];
        }
        if (methodSections) {
            return groupMethodSections(methods, methodSections, t('tokenSelect.otherTokens'));
        }
        return [{ title: '', methods: methods }];
    }, [methods, methodSections, chains, search, t]);

    const isEmpty = displaySections.every((s) => s.methods.length === 0);

    const handleSelect = (method: CryptoPaymentMethod) => () => {
        onSelect(method);
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
        <CurrencySelect.Modal open={open} onOpenChange={handleOpenChange} title={t('cryptoOnramp.methodOfPurchase')}>
            <CurrencySelect.Search
                searchValue={search}
                onSearchChange={setSearch}
                placeholder={t('cryptoOnramp.searchMethod')}
            />

            <CurrencySelect.ListContainer isEmpty={isEmpty}>
                {displaySections.map((section) => (
                    <CurrencySelect.Section key={section.title}>
                        {section.title && <CurrencySelect.SectionHeader>{section.title}</CurrencySelect.SectionHeader>}
                        {section.methods.map((method) => {
                            const chainInfo = getChainInfo(method.chain, chains);
                            return (
                                <CurrencyItem.Container key={method.id} onClick={handleSelect(method)}>
                                    <LogoWithNetwork
                                        size={40}
                                        src={method.logo}
                                        alt={method.symbol}
                                        fallback={method.symbol[0]}
                                        networkSrc={chainInfo.logo}
                                        networkAlt={chainInfo.name[0]}
                                    />
                                    <CurrencyItem.Info>
                                        <CurrencyItem.Header>
                                            <CurrencyItem.Name>{method.name}</CurrencyItem.Name>
                                        </CurrencyItem.Header>
                                        <CurrencyItem.Ticker>
                                            {method.symbol} • {chainInfo.name}
                                        </CurrencyItem.Ticker>
                                    </CurrencyItem.Info>
                                </CurrencyItem.Container>
                            );
                        })}
                    </CurrencySelect.Section>
                ))}
            </CurrencySelect.ListContainer>
        </CurrencySelect.Modal>
    );
};
