/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../../../../components/button';

const SendButtonPreview = ({
    text = 'Send',
    isLoading = false,
    disabled = false,
}: {
    text?: string;
    isLoading?: boolean;
    disabled?: boolean;
}) => {
    return <Button disabled={disabled || isLoading}>{isLoading ? 'Processing...' : text}</Button>;
};

const meta: Meta<typeof SendButtonPreview> = {
    title: 'Public/Features/Balances/SendButton',
    component: SendButtonPreview,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof SendButtonPreview>;

export const SendTon: Story = {
    args: {
        text: 'Send 1.5 TON',
    },
};

export const SendJetton: Story = {
    args: {
        text: 'Send 100 USDT',
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

export const NoRecipient: Story = {
    args: {
        text: 'Send',
        disabled: true,
    },
};
