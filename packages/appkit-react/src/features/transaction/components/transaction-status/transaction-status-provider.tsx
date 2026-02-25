/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { GetTransactionStatusReturnType } from '@ton/appkit';
import type { GetTransactionStatusErrorType } from '@ton/appkit/queries';

import { useTransactionStatus } from '../../hooks/use-transaction-status';

export interface TransactionStatusContextValue extends GetTransactionStatusReturnType {
    isFetching: boolean;
    error: GetTransactionStatusErrorType | null;
    boc: string;
}

export const TransactionStatusContext = createContext<TransactionStatusContextValue | undefined>(undefined);

export const useTransactionStatusContext = () => {
    const context = useContext(TransactionStatusContext);
    if (!context) {
        throw new Error('useTransactionStatusContext must be used within a TransactionStatusProvider');
    }
    return context;
};

export interface TransactionStatusProviderProps {
    boc: string;
    children: ReactNode;
}

export const TransactionStatusProvider = ({ boc, children }: TransactionStatusProviderProps) => {
    const { data, isFetching, error } = useTransactionStatus({
        boc,
        query: {
            refetchInterval: (query) => {
                const status = query.state.data?.status;
                if (status === 'completed' || status === 'failed') return false;
                return 2000;
            },
        },
    });

    const value: TransactionStatusContextValue = {
        status: data?.status ?? 'pending',
        totalMessages: data?.totalMessages ?? 0,
        pendingMessages: data?.pendingMessages ?? 0,
        onchainMessages: data?.onchainMessages ?? 0,
        isFetching,
        error,
        boc,
    };

    return <TransactionStatusContext.Provider value={value}>{children}</TransactionStatusContext.Provider>;
};
