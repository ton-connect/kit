/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Network } from '@ton/appkit';

import { StakingWidget } from './staking-widget';

const meta: Meta<typeof StakingWidget> = {
    title: 'Public/Features/Staking/StakingWidget',
    component: StakingWidget,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StakingWidget>;

export const Default: Story = {};

export const Testnet: Story = {
    args: {
        network: Network.testnet(),
    },
};

export const CustomUI: Story = {
    args: {
        network: Network.mainnet(),
    },
    render: (args) => (
        <StakingWidget {...args}>
            {({ amount, quote, isQuoteLoading, canSubmit, setAmount }) => (
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
                        <label>Stake (TON)</label>
                        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                        <label>You get</label>
                        <input value={isQuoteLoading ? '...' : quote?.amountOut || ''} readOnly />
                    </div>
                    <button disabled={!canSubmit || isQuoteLoading} type="button">
                        {canSubmit ? 'Stake' : 'Enter an amount'}
                    </button>
                </div>
            )}
        </StakingWidget>
    ),
};
