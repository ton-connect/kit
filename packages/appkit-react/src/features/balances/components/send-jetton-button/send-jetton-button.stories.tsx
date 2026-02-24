/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../../../../components/button';

const SendJettonButtonPreview = ({
    text = 'Send USDT',
    isLoading = false,
    disabled = false,
}: {
    text?: string;
    isLoading?: boolean;
    disabled?: boolean;
}) => {
    return <Button disabled={disabled || isLoading}>{isLoading ? 'Processing...' : text}</Button>;
};

const meta: Meta<typeof SendJettonButtonPreview> = {
    title: 'Public/Features/Balances/SendJettonButton',
    component: SendJettonButtonPreview,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof SendJettonButtonPreview>;

export const USDT: Story = {
    args: {
        text: 'Send 100 USDT',
    },
};

export const NOT: Story = {
    args: {
        text: 'Send 500 NOT',
    },
};

export const WithoutAmount: Story = {
    args: {
        text: 'Send USDT',
    },
};

export const Loading: Story = {
    args: {
        isLoading: true,
    },
};

export const Disabled: Story = {
    args: {
        text: 'Send 100 USDT',
        disabled: true,
    },
};
