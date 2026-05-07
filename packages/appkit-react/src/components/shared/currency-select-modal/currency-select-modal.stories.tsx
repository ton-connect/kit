/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { CurrencySelect } from './currency-select-modal';
import { Button } from '../../ui/button';
import { CurrencyItem } from '../currency-item';

const meta: Meta<typeof CurrencySelect.Modal> = {
    title: 'Components/Shared/CurrencySelectModal',
    component: CurrencySelect.Modal,
};

export default meta;

type Story = StoryObj<typeof CurrencySelect.Modal>;

const TOKENS = [
    { ticker: 'TON', name: 'Toncoin', icon: 'https://ton.org/download/ton_symbol.png', balance: '55' },
    { ticker: 'USDT', name: 'Tether USD', balance: '10' },
    { ticker: 'NOT', name: 'Notcoin', balance: '500' },
    { ticker: 'STON', name: 'STON.fi Token', balance: '20' },
    { ticker: 'BOLT', name: 'Bolt', balance: '0' },
];

export const Default: Story = {
    render: () => {
        const Wrapper = () => {
            const [open, setOpen] = useState(false);
            const [search, setSearch] = useState('');

            const filtered = useMemo(() => {
                const q = search.trim().toLowerCase();
                if (!q) return TOKENS;
                return TOKENS.filter((t) => t.ticker.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
            }, [search]);

            return (
                <>
                    <Button onClick={() => setOpen(true)}>Open</Button>
                    <CurrencySelect.Modal
                        open={open}
                        onOpenChange={(v) => {
                            setOpen(v);
                            if (!v) setSearch('');
                        }}
                        title="Select token"
                    >
                        <CurrencySelect.Search
                            searchValue={search}
                            onSearchChange={setSearch}
                            placeholder="Search..."
                        />
                        <CurrencySelect.ListContainer isEmpty={filtered.length === 0}>
                            <CurrencySelect.Section>
                                <CurrencySelect.SectionHeader>Popular</CurrencySelect.SectionHeader>
                                {filtered.map((t) => (
                                    <CurrencyItem
                                        key={t.ticker}
                                        ticker={t.ticker}
                                        name={t.name}
                                        balance={t.balance}
                                        icon={t.icon}
                                        onClick={() => setOpen(false)}
                                    />
                                ))}
                            </CurrencySelect.Section>
                        </CurrencySelect.ListContainer>
                    </CurrencySelect.Modal>
                </>
            );
        };
        return <Wrapper />;
    },
};
