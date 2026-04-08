/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { STORY_TOKENS } from '../../../../storybook/fixtures/tokens';
import { OnrampWidget } from './onramp-widget';

const meta: Meta<typeof OnrampWidget> = {
    title: 'Public/Features/Onramp/OnrampWidget',
    component: OnrampWidget,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OnrampWidget>;

export const Default: Story = {
    args: {
        tokens: STORY_TOKENS,
        defaultTokenId: 'usdt',
        defaultCurrencyId: 'eur',
        tokenSections: [{ title: 'Popular', ids: ['ton', 'usdt'] }],
    },
};

export const CustomUI: Story = {
    args: {
        tokens: STORY_TOKENS,
        defaultTokenId: 'ton',
        defaultCurrencyId: 'usd',
    },
    render: (args) => (
        <OnrampWidget {...args}>
            {({ selectedToken, selectedCurrency, amount, setAmount, canContinue }) => (
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
                        Buy {selectedToken?.symbol} with {selectedCurrency.code}
                    </div>
                    <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        inputMode="decimal"
                        style={{ fontSize: 32, fontWeight: 'bold', border: 'none', outline: 'none' }}
                    />
                    <button disabled={!canContinue} type="button">
                        {canContinue ? 'Continue' : 'Enter an amount'}
                    </button>
                </div>
            )}
        </OnrampWidget>
    ),
};
