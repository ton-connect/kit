/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';

import { CircleIcon } from './circle-icon';

const meta: Meta<typeof CircleIcon> = {
    title: 'Components/CircleIcon',
    component: CircleIcon,
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: { type: 'range', min: 20, max: 100, step: 5 },
        },
    },
};

export default meta;

type Story = StoryObj<typeof CircleIcon>;

export const WithImage: Story = {
    args: {
        size: 48,
        src: 'https://ton.org/download/ton_symbol.png',
        alt: 'TON',
    },
};

export const WithFallback: Story = {
    args: {
        size: 48,
        fallback: 'T',
        alt: 'TON',
    },
};

export const WithInvalidImage: Story = {
    args: {
        size: 48,
        src: 'https://invalid-url.com/image.png',
        alt: 'Fallback',
        fallback: 'F',
    },
};

export const SmallSize: Story = {
    args: {
        size: 24,
        src: 'https://ton.org/download/ton_symbol.png',
        alt: 'TON',
    },
};

export const LargeSize: Story = {
    args: {
        size: 80,
        src: 'https://ton.org/download/ton_symbol.png',
        alt: 'TON',
    },
};
