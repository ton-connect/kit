/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { AmountReversed } from './amount-reversed';

const meta: Meta<typeof AmountReversed> = {
    title: 'Components/UI/AmountReversed',
    component: AmountReversed,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof AmountReversed>;

export const Default: Story = {
    args: {
        value: '144.74',
        ticker: 'USDT',
        decimals: 6,
    },
};

export const WithSymbol: Story = {
    args: {
        value: '144.74',
        symbol: '$',
        decimals: 2,
    },
};

export const WithDirectionToggle: Story = {
    args: {
        value: '100',
        ticker: 'TON',
        decimals: 9,
        onChangeDirection: fn(),
    },
};

export const Loading: Story = {
    args: {
        value: '100',
        ticker: 'TON',
        isLoading: true,
    },
};

export const ZeroValue: Story = {
    args: {
        value: '',
        ticker: 'TON',
    },
};

export const Error: Story = {
    args: {
        value: '0',
        errorMessage: 'Unable to fetch quote',
    },
};
