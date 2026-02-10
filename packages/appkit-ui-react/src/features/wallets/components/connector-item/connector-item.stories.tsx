/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { ConnectorItem } from './connector-item';

const meta: Meta<typeof ConnectorItem> = {
    title: 'Features/Wallets/ConnectorItem',
    component: ConnectorItem,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
    args: {
        onClick: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof ConnectorItem>;

export const WithIcon: Story = {
    args: {
        name: 'Tonkeeper',
        iconUrl: 'https://tonkeeper.com/assets/tonkeeper-logo.png',
    },
};

export const WithoutIcon: Story = {
    args: {
        name: 'Unknown Wallet',
    },
};

export const LongName: Story = {
    args: {
        name: 'Very Long Wallet Name That Might Overflow',
        iconUrl: 'https://tonkeeper.com/assets/tonkeeper-logo.png',
    },
};

export const MultipleConnectors: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '300px' }}>
            <ConnectorItem name="Tonkeeper" iconUrl="https://tonkeeper.com/assets/tonkeeper-logo.png" onClick={fn()} />
            <ConnectorItem name="OpenMask" iconUrl="https://openmask.app/openmask-logo.png" onClick={fn()} />
            <ConnectorItem name="MyTonWallet" onClick={fn()} />
        </div>
    ),
};
