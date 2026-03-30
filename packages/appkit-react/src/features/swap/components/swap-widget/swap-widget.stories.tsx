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
        logo: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#ton)">
                    <path
                        d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37257 18.6274 0 12 0C5.37257 0 0 5.37257 0 12C0 18.6274 5.37257 24 12 24Z"
                        fill="#0098EA"
                    />
                    <path
                        d="M16.0977 6.69763H7.90266C6.39588 6.69763 5.44086 8.32299 6.19891 9.63695L11.2566 18.4033C11.5866 18.9757 12.4137 18.9757 12.7438 18.4033L17.8024 9.63695C18.5595 8.32509 17.6044 6.69763 16.0987 6.69763H16.0977ZM11.2525 15.7744L10.151 13.6426L7.49324 8.88922C7.31791 8.58497 7.53447 8.1951 7.90163 8.1951H11.2514V15.7754L11.2525 15.7744ZM16.505 8.88819L13.8483 13.6437L12.7468 15.7744V8.19407H16.0966C16.4638 8.19407 16.6804 8.58395 16.505 8.88819Z"
                        fill="white"
                    />
                </g>
                <defs>
                    <clipPath id="ton">
                        <rect width="24" height="24" fill="white" />
                    </clipPath>
                </defs>
            </svg>
        ),
    },
    {
        symbol: 'USD₮',
        name: 'Tether USD',
        decimals: 6,
        address: 'UQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_p0p',
        rate: 1.0,
        balance: '12843',
        logo: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#usdt)">
                    <path d="M0 0H24V24H0V0Z" fill="#009393" />
                    <path
                        d="M11.9976 20.1425L3.42618 11.6868L6.69618 6.42822H17.299L20.569 11.6868L11.9976 20.1425ZM12.8547 12.4282V11.3825C14.3976 11.4597 15.8376 11.7597 16.2833 12.1497C15.7647 12.6039 13.909 12.9339 11.9976 12.9339C10.0862 12.9339 8.23046 12.6039 7.71189 12.1497C8.15332 11.7597 9.59761 11.4639 11.1405 11.3782V12.4282H12.8547ZM7.71189 12.1454V12.7754C8.15332 13.1654 9.59332 13.4611 11.1405 13.5468V15.8568H12.8547V13.5425C14.3976 13.4654 15.8419 13.1654 16.2833 12.7754V11.5197C15.8419 11.1297 14.3976 10.8297 12.8547 10.7482V9.85679H15.4262V8.57108H8.56903V9.85679H11.1405V10.7482C9.59332 10.8297 8.15332 11.1297 7.71189 11.5197V12.1454Z"
                        fill="white"
                    />
                </g>
                <defs>
                    <clipPath id="usdt">
                        <rect width="24" height="24" rx="12" fill="white" />
                    </clipPath>
                </defs>
            </svg>
        ),
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
