/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { STORY_TOKENS } from '../../../../storybook/fixtures/tokens';
import { SwapWidget } from './swap-widget';

const meta: Meta<typeof SwapWidget> = {
    title: 'Public/Features/Swap/SwapWidget',
    component: SwapWidget,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SwapWidget>;

export const Default: Story = {
    args: {
        tokens: STORY_TOKENS,
        network: undefined,
        fiatSymbol: '$',
        defaultFromId: 'ton',
        defaultToId: 'usdt',
    },
};

export const CustomUI: Story = {
    args: {
        tokens: STORY_TOKENS,
        network: undefined,
        fiatSymbol: '$',
        defaultFromId: 'ton',
        defaultToId: 'usdt',
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
