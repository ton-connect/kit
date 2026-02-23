/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';

import { I18nProvider } from '../../../../providers/i18n-provider';
import { TransactionStatusContext } from './transaction-status-provider';
import { TransactionStatusContent } from './transaction-status';
import type { TransactionStatusContextValue } from './transaction-status-provider';

// Create a preview wrapper that supplies necessary contexts
const TransactionStatusPreview = ({
    status = 'pending',
    totalMessages = 0,
    completedMessages = 0,
    pendingMessages = 0,
    error = null,
}: Partial<TransactionStatusContextValue>) => {
    const contextValue: TransactionStatusContextValue = {
        status,
        totalMessages,
        completedMessages,
        pendingMessages,
        isFetching: status === 'pending',
        error,
        boc: 'te6cc...',
    };

    return (
        <I18nProvider>
            <TransactionStatusContext.Provider value={contextValue}>
                <div style={{ width: '400px', display: 'flex', justifyContent: 'center' }}>
                    <TransactionStatusContent />
                </div>
            </TransactionStatusContext.Provider>
        </I18nProvider>
    );
};

const meta: Meta<typeof TransactionStatusPreview> = {
    title: 'Public/Features/Transaction/TransactionStatus',
    component: TransactionStatusPreview,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof TransactionStatusPreview>;

export const PendingInitial: Story = {
    args: {
        status: 'pending',
        totalMessages: 0,
        completedMessages: 0,
    },
};

export const PendingWithProgress: Story = {
    args: {
        status: 'pending',
        totalMessages: 5,
        completedMessages: 3,
        pendingMessages: 2,
    },
};

export const Completed: Story = {
    args: {
        status: 'completed',
        totalMessages: 5,
        completedMessages: 5,
        pendingMessages: 0,
    },
};

export const Failed: Story = {
    args: {
        status: 'failed',
    },
};

export const ErrorState: Story = {
    args: {
        status: 'pending',
        error: new Error('Simulation failed or transaction rejected'),
    },
};
