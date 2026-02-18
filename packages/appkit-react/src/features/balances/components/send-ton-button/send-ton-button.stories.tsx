/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../../../../components/button';

const SendTonButtonPreview = ({
    text = 'Send TON',
    isLoading = false,
    disabled = false,
}: {
    text?: string;
    isLoading?: boolean;
    disabled?: boolean;
}) => {
    return <Button disabled={disabled || isLoading}>{isLoading ? 'Processing...' : text}</Button>;
};

const meta: Meta<typeof SendTonButtonPreview> = {
    title: 'Public/Features/Balances/SendTonButton',
    component: SendTonButtonPreview,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof SendTonButtonPreview>;

export const Default: Story = {
    args: {
        text: 'Send 1.5 TON',
    },
};

export const LargeAmount: Story = {
    args: {
        text: 'Send 999.99 TON',
    },
};

export const Loading: Story = {
    args: {
        isLoading: true,
    },
};

export const Disabled: Story = {
    args: {
        text: 'Send 1.5 TON',
        disabled: true,
    },
};
