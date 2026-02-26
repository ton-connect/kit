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

export interface TransactionProgressContextValue extends GetTransactionStatusReturnType {
    isFetching: boolean;
    error: GetTransactionStatusErrorType | null;
    boc: string;
}

export const TransactionProgressContext = createContext<TransactionProgressContextValue | undefined>(undefined);

export const useTransactionProgressContext = () => {
    const context = useContext(TransactionProgressContext);
    if (!context) {
        throw new Error('useTransactionProgressContext must be used within a TransactionProgressProvider');
    }
    return context;
};

export interface TransactionProgressProviderProps {
    boc: string;
    children: ReactNode;
}

export const TransactionProgressProvider = ({ boc, children }: TransactionProgressProviderProps) => {
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

    const value: TransactionProgressContextValue = {
        status: data?.status ?? 'pending',
        totalMessages: data?.totalMessages ?? 0,
        pendingMessages: data?.pendingMessages ?? 0,
        onchainMessages: data?.onchainMessages ?? 0,
        isFetching,
        error,
        boc,
    };

    return <TransactionProgressContext.Provider value={value}>{children}</TransactionProgressContext.Provider>;
};
