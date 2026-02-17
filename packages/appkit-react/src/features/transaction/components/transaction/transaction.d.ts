/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { FC, ReactNode, ComponentProps } from 'react';
import type { SendTransactionParameters, SendTransactionReturnType } from '@ton/appkit';
export interface TransactionRenderProps {
    isLoading: boolean;
    onSubmit: () => void;
    disabled: boolean;
    text: ReactNode;
}
export type TransactionRequest = SendTransactionParameters | (() => SendTransactionParameters) | (() => Promise<SendTransactionParameters>);
export interface TransactionProps extends Omit<ComponentProps<'button'>, 'children' | 'onError'> {
    /** The transaction request parameters */
    request: TransactionRequest;
    /** Callback when an error occurs */
    onError?: (error: Error) => void;
    /** Callback when the transaction is successful */
    onSuccess?: (response: SendTransactionReturnType) => void;
    /** Custom button text */
    text?: ReactNode;
    /** Custom render function */
    children?: (props: TransactionRenderProps) => ReactNode;
}
export declare const Transaction: FC<TransactionProps>;
//# sourceMappingURL=transaction.d.ts.map