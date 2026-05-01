/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { InfoBlock } from './info-block';

const meta: Meta = {
    title: 'Private/Components/InfoBlock',
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
    render: () => (
        <InfoBlock.Container>
            <InfoBlock.Row>
                <InfoBlock.Label>Provider</InfoBlock.Label>
                <InfoBlock.Value>DeDust</InfoBlock.Value>
            </InfoBlock.Row>
            <InfoBlock.Row>
                <InfoBlock.Label>Min received</InfoBlock.Label>
                <InfoBlock.Value>1.23 USDT</InfoBlock.Value>
            </InfoBlock.Row>
            <InfoBlock.Row>
                <InfoBlock.Label>Slippage</InfoBlock.Label>
                <InfoBlock.Value>1.00%</InfoBlock.Value>
            </InfoBlock.Row>
        </InfoBlock.Container>
    ),
};

export const Loading: Story = {
    render: () => (
        <InfoBlock.Container>
            <InfoBlock.Row>
                <InfoBlock.Label>Provider</InfoBlock.Label>
                <InfoBlock.ValueSkeleton />
            </InfoBlock.Row>
            <InfoBlock.Row>
                <InfoBlock.Label>Min received</InfoBlock.Label>
                <InfoBlock.ValueSkeleton />
            </InfoBlock.Row>
            <InfoBlock.Row>
                <InfoBlock.Label>Slippage</InfoBlock.Label>
                <InfoBlock.ValueSkeleton />
            </InfoBlock.Row>
        </InfoBlock.Container>
    ),
};
