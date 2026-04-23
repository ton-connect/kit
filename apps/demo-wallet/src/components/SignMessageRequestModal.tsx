/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import type { SignMessageRequestEvent } from '@ton/walletkit';
import type { SavedWallet } from '@demo/wallet-core';
import { useSignMessageRequests } from '@demo/wallet-core';

import { RequestModal } from './RequestModal';

interface SignMessageRequestModalProps {
    request: SignMessageRequestEvent;
    savedWallets: SavedWallet[];
    isOpen: boolean;
}

export const SignMessageRequestModal: React.FC<SignMessageRequestModalProps> = ({ request, savedWallets, isOpen }) => {
    const { approveSignMessageRequest, rejectSignMessageRequest } = useSignMessageRequests();

    const handleApprove = async () => {
        await approveSignMessageRequest();
    };

    const handleReject = () => {
        rejectSignMessageRequest('User rejected the sign message request');
    };

    return (
        <RequestModal
            request={request}
            savedWallets={savedWallets}
            isOpen={isOpen}
            title="Sign Message Request"
            subtitle="A dApp wants you to sign a transaction without broadcasting it"
            warning={{
                tone: 'yellow',
                message: (
                    <>
                        <strong>Warning:</strong> This will sign a transaction that the dApp can submit later. Only
                        approve if you trust the requesting dApp.
                    </>
                ),
            }}
            approveLabel="Sign Message"
            successMessage="Message signed successfully"
            testIds={{
                request: 'request',
                approve: 'sign-message-approve',
                reject: 'sign-message-reject',
            }}
            onApprove={handleApprove}
            onReject={handleReject}
            loggerName="SignMessageRequestModal"
            previewMode="sign"
        />
    );
};
