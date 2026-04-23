/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import type { SendTransactionRequestEvent } from '@ton/walletkit';
import { getNormalizedExtMessageHash } from '@ton/walletkit';
import { getTransactionExplorerUrls, useTransactionRequests } from '@demo/wallet-core';
import type { SavedWallet } from '@demo/wallet-core';
import { toast } from 'sonner';

import { RequestModal } from './RequestModal';
import { useActiveWalletNetwork } from './JettonFlow';

interface TransactionRequestModalProps {
    request: SendTransactionRequestEvent;
    savedWallets: SavedWallet[];
    isOpen: boolean;
}

export const TransactionRequestModal: React.FC<TransactionRequestModalProps> = ({ request, savedWallets, isOpen }) => {
    const network = useActiveWalletNetwork();
    const { approveTransactionRequest, rejectTransactionRequest } = useTransactionRequests();

    const handleApprove = async () => {
        const result = await approveTransactionRequest();
        if (result?.signedBoc) {
            const { hash } = getNormalizedExtMessageHash(result.signedBoc);
            const { tonScan, tonViewer } = getTransactionExplorerUrls(hash, network);
            toast.success('Transaction is sent to the network', {
                description: (
                    <span className="flex gap-3 mt-1">
                        <a href={tonScan} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                            TonScan
                        </a>
                        <a
                            href={tonViewer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                        >
                            TonViewer
                        </a>
                    </span>
                ),
            });
        }
    };

    const handleReject = () => {
        rejectTransactionRequest('User rejected the transaction');
    };

    return (
        <RequestModal
            request={request}
            savedWallets={savedWallets}
            isOpen={isOpen}
            title="Transaction Request"
            subtitle="A dApp wants to send a transaction from your wallet"
            warning={{
                tone: 'red',
                message: (
                    <>
                        <strong>Warning:</strong> This transaction will be irreversible. Only approve if you trust the
                        requesting dApp and understand the transaction details.
                    </>
                ),
            }}
            approveLabel="Approve & Sign"
            successMessage="Transaction signed successfully"
            testIds={{
                request: 'request',
                approve: 'send-transaction-approve',
                reject: 'send-transaction-reject',
            }}
            onApprove={handleApprove}
            onReject={handleReject}
            loggerName="TransactionRequestModal"
            previewMode="send"
        />
    );
};
