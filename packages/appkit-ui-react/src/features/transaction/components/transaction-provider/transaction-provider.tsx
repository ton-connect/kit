/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { FC } from 'react';
import type { SendTransactionReturnType } from '@ton/appkit';

import { useSendTransaction } from '../../hooks/use-send-transaction';
import type { TransactionProps } from '../transaction';

export interface TransactionContextType {
    /** Function to submit the transaction */
    onSubmit: () => void;
    /** Whether the transaction is currently loading */
    isLoading: boolean;
    /** The error object if the transaction failed */
    error?: Error | null;
    /** The receipt of the successful transaction */
    receipt?: SendTransactionReturnType | null;
    /** Disable the button/interaction */
    disabled?: boolean;
}

export const TransactionContext = createContext<TransactionContextType>({
    onSubmit: () => {
        throw new Error('onSubmit is not defined');
    },
    isLoading: false,
});

export function useTransactionContext() {
    const context = useContext(TransactionContext);

    return context;
}

export const TransactionProvider: FC<TransactionProps> = ({
    children,
    getTransactionRequest,
    onError,
    onSuccess,
    disabled = false,
}) => {
    const [receipt, setReceipt] = useState<SendTransactionReturnType | null>(null);
    const [isPreparing, setIsPreparing] = useState(false);

    const {
        mutateAsync: sendTransaction,
        isPending,
        error: mutationError,
    } = useSendTransaction({
        onSuccess: (data: SendTransactionReturnType) => {
            setReceipt(data);
            onSuccess?.(data);
        },
        onError: (err: Error) => {
            onError?.(err);
        },
    });

    const handleSubmit = useCallback(async () => {
        if (disabled || isPreparing || isPending) {
            return;
        }

        setIsPreparing(true);

        try {
            const transactionRequest = await getTransactionRequest();

            if (!transactionRequest) {
                return;
            }

            await sendTransaction(transactionRequest);
        } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            onError?.(error);
        } finally {
            setIsPreparing(false);
        }
    }, [sendTransaction, getTransactionRequest, disabled, isPreparing, isPending, onError]);

    const value = useMemo(
        () => ({
            error: mutationError,
            isLoading: isPreparing || isPending,
            onSubmit: handleSubmit,
            receipt,
            disabled,
        }),
        [mutationError, isPreparing, isPending, handleSubmit, receipt, disabled],
    );

    return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
};
