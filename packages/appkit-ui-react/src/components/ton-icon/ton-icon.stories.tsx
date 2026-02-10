/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';

import { TonIcon, TonIconCircle } from './ton-icon';

const meta: Meta<typeof TonIcon> = {
    title: 'Components/TonIcon',
    component: TonIcon,
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: { type: 'range', min: 12, max: 64, step: 4 },
        },
    },
    decorators: [
        (Story) => (
            <div style={{ color: 'white' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof TonIcon>;

export const Default: Story = {
    args: {
        size: 24,
    },
};

export const Small: Story = {
    args: {
        size: 16,
    },
};

export const Large: Story = {
    args: {
        size: 48,
    },
};

export const CustomColor: Story = {
    args: {
        size: 32,
        style: { color: '#0098EB' },
    },
};

export const Circle: StoryObj<typeof TonIconCircle> = {
    render: (args) => <TonIconCircle {...args} />,
    args: {
        size: 48,
    },
};

export const CircleSmall: StoryObj<typeof TonIconCircle> = {
    render: (args) => <TonIconCircle {...args} />,
    args: {
        size: 24,
    },
};

export const CircleLarge: StoryObj<typeof TonIconCircle> = {
    render: (args) => <TonIconCircle {...args} />,
    args: {
        size: 72,
    },
};
