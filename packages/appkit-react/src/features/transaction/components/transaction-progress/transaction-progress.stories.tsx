/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';

import { I18nProvider } from '../../../../providers/i18n-provider';
import { TransactionProgressContext } from './transaction-progress-provider';
import { TransactionProgressContent } from './transaction-progress';
import type { TransactionProgressContextValue } from './transaction-progress-provider';

// Create a preview wrapper that supplies necessary contexts
const TransactionProgressPreview = ({
    status = 'pending',
    totalMessages = 0,
    onchainMessages = 0,
    pendingMessages = 0,
    error = null,
}: Partial<TransactionProgressContextValue>) => {
    const contextValue: TransactionProgressContextValue = {
        status,
        totalMessages,
        onchainMessages,
        pendingMessages,
        isFetching: status === 'pending',
        error,
        boc: 'te6cc...',
    };

    return (
        <I18nProvider>
            <TransactionProgressContext.Provider value={contextValue}>
                <div style={{ width: '400px', display: 'flex', justifyContent: 'center' }}>
                    <TransactionProgressContent />
                </div>
            </TransactionProgressContext.Provider>
        </I18nProvider>
    );
};

const meta: Meta<typeof TransactionProgressPreview> = {
    title: 'Public/Features/Transaction/TransactionProgress',
    component: TransactionProgressPreview,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof TransactionProgressPreview>;

export const PendingInitial: Story = {
    args: {
        status: 'pending',
        totalMessages: 0,
        onchainMessages: 0,
    },
};

export const PendingWithProgress: Story = {
    args: {
        status: 'pending',
        totalMessages: 5,
        onchainMessages: 3,
        pendingMessages: 2,
    },
};

export const Completed: Story = {
    args: {
        status: 'completed',
        totalMessages: 5,
        onchainMessages: 5,
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
