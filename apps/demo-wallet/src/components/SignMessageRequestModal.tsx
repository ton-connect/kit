/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import type { SignMessageRequestEvent } from '@ton/walletkit';
import { useSignMessageRequests } from '@demo/wallet-core';
import type { SavedWallet } from '@demo/wallet-core';

import { Button } from './Button';
import { Card } from './Card';
import { DAppInfo } from './DAppInfo';

interface SignMessageRequestModalProps {
    request: SignMessageRequestEvent;
    savedWallets: SavedWallet[];
    isOpen: boolean;
}

export const SignMessageRequestModal: React.FC<SignMessageRequestModalProps> = ({ request, isOpen }) => {
    const { approveSignMessageRequest, rejectSignMessageRequest } = useSignMessageRequests();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-xl font-bold">Sign Message Request</h2>
                <DAppInfo dAppInfo={request.dAppInfo} />
                <Card title="Messages to sign">
                    <p className="text-sm text-gray-600">
                        {request.request.messages.length} message(s) · sign-only (not broadcast)
                    </p>
                    {request.request.messages.map((msg, i) => (
                        <div key={i} className="mt-2 text-xs text-gray-500">
                            <span className="font-mono">{msg.address}</span>
                            <span className="ml-2">{(BigInt(msg.amount) / 1_000_000_000n).toString()} TON</span>
                        </div>
                    ))}
                </Card>
                <div className="mt-4 flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => rejectSignMessageRequest()}>
                        Reject
                    </Button>
                    <Button className="flex-1" onClick={() => approveSignMessageRequest()}>
                        Sign
                    </Button>
                </div>
            </div>
        </div>
    );
};
