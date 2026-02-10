/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';

import { CloseIcon } from './close-icon';

const meta: Meta<typeof CloseIcon> = {
    title: 'Components/CloseIcon',
    component: CloseIcon,
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: { type: 'range', min: 12, max: 48, step: 4 },
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

type Story = StoryObj<typeof CloseIcon>;

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
        size: 32,
    },
};

export const CustomColor: Story = {
    args: {
        size: 24,
        style: { color: '#0098EB' },
    },
};
