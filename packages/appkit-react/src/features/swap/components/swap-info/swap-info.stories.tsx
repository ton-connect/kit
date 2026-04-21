/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { SwapInfo } from './swap-info';

const meta: Meta<typeof SwapInfo> = {
    title: 'Public/Features/Swap/Internal/SwapInfo',
    component: SwapInfo,
};

export default meta;
type Story = StoryObj<typeof SwapInfo>;

export const Default: Story = {
    args: {
        rows: [
            { label: 'Exchange Rate', value: '1 TON ≈ 5.5 USDT' },
            { label: 'Minimum Received', value: '24.9 USDT' },
            { label: 'Price Impact', value: '0.1%' },
            { label: 'Network Fee', value: '0.05 TON' },
        ],
        isLoading: false,
    },
};

export const Loading: Story = {
    args: {
        rows: [],
        isLoading: true,
    },
};
