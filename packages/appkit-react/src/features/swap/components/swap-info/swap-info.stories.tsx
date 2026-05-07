/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SwapProvider, SwapQuote } from '@ton/appkit';

import { SwapInfo } from './swap-info';
import type { AppkitUIToken } from '../../../../types/appkit-ui-token';

const meta: Meta<typeof SwapInfo> = {
    title: 'Features/Swap/Internal/SwapInfo',
    component: SwapInfo,
};

export default meta;
type Story = StoryObj<typeof SwapInfo>;

const toToken = {
    address: 'EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    imageUrl: '',
} as unknown as AppkitUIToken;

const quote = {
    minReceived: '24900000',
    providerId: 'stonfi',
} as unknown as SwapQuote;

const provider = {
    getMetadata: () => ({ name: 'STON.fi' }),
} as unknown as SwapProvider;

export const Default: Story = {
    args: {
        quote,
        provider,
        toToken,
        slippage: 100,
        isQuoteLoading: false,
    },
};

export const Loading: Story = {
    args: {
        toToken: null,
        slippage: 100,
        isQuoteLoading: true,
    },
};
