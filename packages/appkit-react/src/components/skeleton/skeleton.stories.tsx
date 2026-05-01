/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Skeleton } from './skeleton';

const meta: Meta<typeof Skeleton> = {
    title: 'Public/Components/Skeleton',
    component: Skeleton,
    tags: ['autodocs'],
    argTypes: {
        width: {
            control: 'text',
        },
        height: {
            control: 'text',
        },
    },
    args: {
        width: 100,
        height: 20,
    },
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {};

export const CustomSize: Story = {
    args: {
        width: '100%',
        height: 100,
    },
};

export const Circular: Story = {
    args: {
        width: 48,
        height: 48,
        style: { borderRadius: '50%' },
    },
};

export const ParagraphPlaceholder: Story = {
    render: (args) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '300px' }}>
            <Skeleton {...args} width="80%" height={24} />
            <Skeleton {...args} width="100%" height={16} />
            <Skeleton {...args} width="90%" height={16} />
            <Skeleton {...args} width="60%" height={16} />
        </div>
    ),
    args: {},
};
