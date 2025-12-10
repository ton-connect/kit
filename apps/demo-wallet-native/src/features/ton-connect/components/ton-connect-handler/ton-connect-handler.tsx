/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { useTonConnect, useTransactionRequests, useSignDataRequests, useWalletStore } from '@ton/demo-core';

import { ConnectRequestModal } from '../connect-request-modal';
import { TransactionRequestModal } from '../transaction-request-modal';
import { SignDataRequestModal } from '../sign-data-request-modal';

export const TonConnectHandler: FC = () => {
    const isUnlocked = useWalletStore((state) => state.auth.isUnlocked);

    const { pendingConnectRequest, isConnectModalOpen, approveConnectRequest, rejectConnectRequest } = useTonConnect();
    const { pendingTransactionRequest, isTransactionModalOpen, approveTransactionRequest, rejectTransactionRequest } =
        useTransactionRequests();
    const { pendingSignDataRequest, isSignDataModalOpen, approveSignDataRequest, rejectSignDataRequest } =
        useSignDataRequests();

    if (!isUnlocked) {
        return null;
    }

    return (
        <>
            {pendingConnectRequest && (
                <ConnectRequestModal
                    request={pendingConnectRequest}
                    isOpen={isConnectModalOpen}
                    onApprove={approveConnectRequest}
                    onReject={rejectConnectRequest}
                />
            )}

            {pendingTransactionRequest && (
                <TransactionRequestModal
                    request={pendingTransactionRequest}
                    isOpen={isTransactionModalOpen}
                    onApprove={approveTransactionRequest}
                    onReject={rejectTransactionRequest}
                />
            )}

            {pendingSignDataRequest && (
                <SignDataRequestModal
                    request={pendingSignDataRequest}
                    isOpen={isSignDataModalOpen}
                    onApprove={approveSignDataRequest}
                    onReject={rejectSignDataRequest}
                />
            )}
        </>
    );
};
