/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { CryptoOnrampRefundAddressModal } from './crypto-onramp-refund-address-modal';

const meta: Meta<typeof CryptoOnrampRefundAddressModal> = {
    title: 'Features/Onramp/Internal/CryptoOnrampRefundAddressModal',
    component: CryptoOnrampRefundAddressModal,
};

export default meta;
type Story = StoryObj<typeof CryptoOnrampRefundAddressModal>;

export const Default: Story = {
    args: {
        open: true,
        value: '',
        isLoading: false,
        onClose: () => {},
        onChange: () => {},
        onConfirm: () => {},
    },
};

export const WithValue: Story = {
    args: {
        ...Default.args,
        value: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
};

export const WithError: Story = {
    args: {
        ...Default.args,
        value: '0xinvalid',
        error: 'Invalid refund address',
    },
};

export const Loading: Story = {
    args: {
        ...Default.args,
        value: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        isLoading: true,
    },
};
