/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { TokenSelector } from './token-selector';

const meta: Meta<typeof TokenSelector> = {
    title: 'Components/Shared/TokenSelector',
    component: TokenSelector,
    tags: ['autodocs'],
    args: {
        onClick: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof TokenSelector>;

const TON_ICON = 'https://ton.org/download/ton_symbol.png';

export const Default: Story = {
    args: {
        title: 'TON',
        icon: TON_ICON,
    },
};

export const NoIcon: Story = {
    args: {
        title: 'USDT',
    },
};

export const Empty: Story = {
    args: {
        title: 'Select token',
    },
};

export const WithNetwork: Story = {
    args: {
        title: 'USDC',
        icon: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png',
        networkIcon: TON_ICON,
    },
};

export const ReadOnly: Story = {
    args: {
        title: 'TON',
        icon: TON_ICON,
        readOnly: true,
    },
};
