/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';

import { BalanceBadge } from './balance-badge';

const meta: Meta = {
    title: 'Public/Features/Balances/BalanceBadge',
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj;

export const TonBalance: Story = {
    render: () => (
        <BalanceBadge.Container>
            <BalanceBadge.Icon src="https://ton.org/download/ton_symbol.png" alt="TON" size={40} />
            <BalanceBadge.BalanceBlock>
                <BalanceBadge.Balance balance="1500000000" decimals={9} />
                <BalanceBadge.Symbol symbol="TON" />
            </BalanceBadge.BalanceBlock>
        </BalanceBadge.Container>
    ),
};

export const JettonBalance: Story = {
    render: () => (
        <BalanceBadge.Container>
            <BalanceBadge.Icon fallback="U" alt="USDT" size={40} />
            <BalanceBadge.BalanceBlock>
                <BalanceBadge.Balance balance="100000000" decimals={6} />
                <BalanceBadge.Symbol symbol="USDT" />
            </BalanceBadge.BalanceBlock>
        </BalanceBadge.Container>
    ),
};

export const ZeroBalance: Story = {
    render: () => (
        <BalanceBadge.Container>
            <BalanceBadge.Icon src="https://ton.org/download/ton_symbol.png" alt="TON" size={40} />
            <BalanceBadge.BalanceBlock>
                <BalanceBadge.Balance balance="" decimals={9} />
                <BalanceBadge.Symbol symbol="TON" />
            </BalanceBadge.BalanceBlock>
        </BalanceBadge.Container>
    ),
};

export const LargeBalance: Story = {
    render: () => (
        <BalanceBadge.Container>
            <BalanceBadge.Icon src="https://ton.org/download/ton_symbol.png" alt="TON" size={40} />
            <BalanceBadge.BalanceBlock>
                <BalanceBadge.Balance balance="999999999999999999" decimals={9} />
                <BalanceBadge.Symbol symbol="TON" />
            </BalanceBadge.BalanceBlock>
        </BalanceBadge.Container>
    ),
};
