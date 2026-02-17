/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { FC, PropsWithChildren } from 'react';
import type { SendTransactionReturnType } from '@ton/appkit';
import type { TransactionRequest } from '../transaction/transaction';
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
export declare const TransactionContext: import("react").Context<TransactionContextType>;
export declare function useTransactionContext(): TransactionContextType;
export interface TransactionProviderProps extends PropsWithChildren {
    /** The transaction request parameters */
    request: TransactionRequest;
    /** Callback when an error occurs */
    onError?: (error: Error) => void;
    /** Callback when the transaction is successful */
    onSuccess?: (response: SendTransactionReturnType) => void;
    /** Disable the button/interaction */
    disabled?: boolean;
}
export declare const TransactionProvider: FC<TransactionProviderProps>;
//# sourceMappingURL=transaction-provider.d.ts.map