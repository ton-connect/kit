/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Network } from '@ton/appkit';

import { SwapWidget } from './swap-widget';
import type { SwapWidgetToken } from '../swap-widget-provider';

const TOKENS: SwapWidgetToken[] = [
    {
        symbol: 'TON',
        name: 'Toncoin',
        decimals: 9,
        address: 'ton',
        rate: 1.4474,
        balance: '500',
        logo: 'https://asset.ston.fi/img/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c/c8d21a3d93f9b574381e0a8d8f16d48b325dd8f54ce172f599c1e9d6c62f03f7',
    },
    {
        symbol: 'USD₮',
        name: 'Tether USD',
        decimals: 6,
        address: 'UQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_p0p',
        rate: 1.0,
        balance: '12843',
        logo: 'https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/1a87edfee9a28b05578853952e5effb8cc30af1e0fb90043aa2ce19dce490849',
    },
];

const meta: Meta<typeof SwapWidget> = {
    title: 'Public/Features/Swap/SwapWidget',
    component: SwapWidget,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SwapWidget>;

export const Default: Story = {
    args: {
        tokens: TOKENS,
        network: Network.mainnet(),
        fiatSymbol: '$',
        defaultFromSymbol: 'TON',
        defaultToSymbol: 'USDT',
    },
};

export const CustomUI: Story = {
    args: {
        tokens: TOKENS,
        network: Network.mainnet(),
        fiatSymbol: '$',
        defaultFromSymbol: 'TON',
        defaultToSymbol: 'USDT',
    },
    render: (args) => (
        <SwapWidget {...args}>
            {({ fromToken, toToken, fromAmount, toAmount, isQuoteLoading, canSubmit, setFromAmount, onFlip }) => (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        padding: 16,
                        border: '1px solid #ccc',
                        borderRadius: 12,
                    }}
                >
                    <div>
                        <label>Pay ({fromToken?.symbol})</label>
                        <input value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} placeholder="0" />
                    </div>
                    <button onClick={onFlip} type="button">
                        ⇅ Flip
                    </button>
                    <div>
                        <label>Receive ({toToken?.symbol})</label>
                        <input value={isQuoteLoading ? '...' : toAmount} readOnly />
                    </div>
                    <button disabled={!canSubmit || isQuoteLoading} type="button">
                        {canSubmit ? 'Continue' : 'Enter an amount'}
                    </button>
                </div>
            )}
        </SwapWidget>
    ),
};
