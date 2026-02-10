/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../../../../components/button';
import { TonIcon } from '../../../../components/ton-icon';

// Create a preview component that doesn't depend on context
const ConnectButtonPreview = ({
    isConnected = false,
    isLoading = false,
}: {
    isConnected?: boolean;
    isLoading?: boolean;
}) => {
    return (
        <Button disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isConnected && <TonIcon size={14} />}
            {isLoading ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
        </Button>
    );
};

const meta: Meta<typeof ConnectButtonPreview> = {
    title: 'Features/Wallets/ConnectButton',
    component: ConnectButtonPreview,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof ConnectButtonPreview>;

export const Disconnected: Story = {
    args: {
        isConnected: false,
    },
};

export const Connected: Story = {
    args: {
        isConnected: true,
    },
};

export const Loading: Story = {
    args: {
        isConnected: false,
        isLoading: true,
    },
};
