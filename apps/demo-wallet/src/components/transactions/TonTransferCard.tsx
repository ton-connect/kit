/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { memo } from 'react';
import type { TonTransferAction } from '@ton/walletkit';

import { formatAddress, formatTimestamp } from '../../utils';
import { formatTon } from '../../utils/units';

interface TonTransferCardProps {
    action: TonTransferAction;
    myAddress: string;
    eventId: string;
    timestamp: number;
    traceLink: string;
}

/**
 * Component for displaying a single TON transfer transaction
 */
export const TonTransferCard: React.FC<TonTransferCardProps> = memo(
    ({ action, myAddress, eventId, timestamp, traceLink }) => {
        const isOutgoing = action.TonTransfer.sender.address === myAddress;
        const amount = formatTon(action.TonTransfer.amount);
        const otherAddress = isOutgoing ? action.TonTransfer.recipient.address : action.TonTransfer.sender.address;

        return (
            <a
                key={eventId}
                href={traceLink}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-100"
            >
                <div className="flex items-center space-x-3">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${isOutgoing ? 'bg-red-100' : 'bg-green-100'}`}
                    >
                        {isOutgoing ? (
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 11l5-5m0 0l5 5m-5-5v12"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="w-4 h-4 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 13l-5 5m0 0l-5-5m5 5V6"
                                />
                            </svg>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">{isOutgoing ? 'Sent TON' : 'Received TON'}</p>
                        <p className="text-xs text-gray-500">{formatAddress(otherAddress)}</p>
                        {action.TonTransfer.comment && (
                            <p className="mt-1 text-xs text-gray-600 break-all">{action.TonTransfer.comment}</p>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-medium ${isOutgoing ? 'text-red-600' : 'text-green-600'}`}>
                        {isOutgoing ? '-' : '+'}
                        {amount} TON
                    </p>
                    <p className="text-xs text-gray-400">{formatTimestamp(timestamp)}</p>
                </div>
            </a>
        );
    },
);
