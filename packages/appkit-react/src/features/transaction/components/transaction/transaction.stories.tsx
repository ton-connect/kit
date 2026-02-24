/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../../../../components/button';

// Create a preview component that doesn't depend on context
const TransactionButtonPreview = ({
    text = 'Send Transaction',
    isLoading = false,
    disabled = false,
}: {
    text?: string;
    isLoading?: boolean;
    disabled?: boolean;
}) => {
    return <Button disabled={disabled || isLoading}>{isLoading ? 'Processing...' : text}</Button>;
};

const meta: Meta<typeof TransactionButtonPreview> = {
    title: 'Public/Features/Transaction/Transaction',
    component: TransactionButtonPreview,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof TransactionButtonPreview>;

export const Default: Story = {
    args: {
        text: 'Send Transaction',
    },
};

export const CustomText: Story = {
    args: {
        text: 'Send 1.5 TON',
    },
};

export const Loading: Story = {
    args: {
        isLoading: true,
    },
};

export const Disabled: Story = {
    args: {
        text: 'Send Transaction',
        disabled: true,
    },
};

export const SendTonButton: Story = {
    args: {
        text: 'Send 10 TON',
    },
};

export const SendJettonButton: Story = {
    args: {
        text: 'Send 100 USDT',
    },
};
