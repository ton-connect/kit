/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { CurrencyItem } from './currency-item';

const meta: Meta<typeof CurrencyItem> = {
    title: 'Features/Balances/CurrencyItem',
    component: CurrencyItem,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
    args: {
        onClick: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof CurrencyItem>;

export const TON: Story = {
    args: {
        ticker: 'TON',
        name: 'Toncoin',
        balance: '5500000000',
        decimals: 9,
        icon: 'https://ton.org/download/ton_symbol.png',
        isVerified: true,
    },
};

export const USDT: Story = {
    args: {
        ticker: 'USDT',
        name: 'Tether USD',
        balance: '100000000',
        decimals: 6,
        isVerified: true,
    },
};

export const Unverified: Story = {
    args: {
        ticker: 'MEME',
        name: 'Meme Token',
        balance: '1000000000000',
        decimals: 9,
        isVerified: false,
    },
};

export const ZeroBalance: Story = {
    args: {
        ticker: 'TON',
        name: 'Toncoin',
        balance: '0',
        decimals: 9,
        icon: 'https://ton.org/download/ton_symbol.png',
        isVerified: true,
    },
};

export const NoBalance: Story = {
    args: {
        ticker: 'TON',
        name: 'Toncoin',
        icon: 'https://ton.org/download/ton_symbol.png',
        isVerified: true,
    },
};

export const CurrencyList: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '320px' }}>
            <CurrencyItem
                ticker="TON"
                name="Toncoin"
                balance="5500000000"
                decimals={9}
                icon="https://ton.org/download/ton_symbol.png"
                isVerified={true}
                onClick={fn()}
            />
            <CurrencyItem
                ticker="USDT"
                name="Tether USD"
                balance="100000000"
                decimals={6}
                isVerified={true}
                onClick={fn()}
            />
            <CurrencyItem
                ticker="NOT"
                name="Notcoin"
                balance="50000000000"
                decimals={9}
                isVerified={true}
                onClick={fn()}
            />
        </div>
    ),
};
