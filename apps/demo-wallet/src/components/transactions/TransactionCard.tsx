/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { memo } from 'react';
import { Link } from 'react-router-dom';

import { formatTimestamp } from '../../utils';

export interface TransactionCardProps {
    description: string;
    value: string;
    valueImage?: string;
    timestamp: number;
    traceLink: string;
    status: 'pending' | 'success' | 'failure';
    isOutgoing?: boolean;
    /** Debug ID for DOM inspection (data-debug-id) */
    debugId?: string;
}

/**
 * Unified card for pending and confirmed transactions.
 * Same layout: description, value, timestamp. Only status icon differs.
 */
export const TransactionCard: React.FC<TransactionCardProps> = memo(
    ({ description, value, valueImage, timestamp, traceLink, status, isOutgoing = false, debugId }) => {
        const isFailed = status === 'failure';
        const isPending = status === 'pending';

        const { bgColor, icon } = (() => {
            if (isPending) {
                return {
                    bgColor: 'bg-yellow-100',
                    icon: (
                        <div className="w-2.5 h-2.5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                    ),
                };
            }
            if (isFailed) {
                return {
                    bgColor: 'bg-red-100',
                    icon: (
                        <svg className="w-2.5 h-2.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    ),
                };
            }
            if (isOutgoing) {
                return {
                    bgColor: 'bg-red-100',
                    icon: (
                        <svg className="w-2.5 h-2.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 11l5-5m0 0l5 5m-5-5v12"
                            />
                        </svg>
                    ),
                };
            }
            return {
                bgColor: 'bg-green-100',
                icon: (
                    <svg className="w-2.5 h-2.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 13l-5 5m0 0l-5-5m5 5V6"
                        />
                    </svg>
                ),
            };
        })();

        const valueColor = isFailed ? 'text-red-600' : isOutgoing ? 'text-red-600' : 'text-green-600';
        const valueWithSign = isFailed ? value : isOutgoing ? `-${value}` : `+${value}`;
        const statusText = isPending ? 'Pending' : isFailed ? 'Failed' : formatTimestamp(timestamp);

        return (
            <Link
                to={traceLink}
                className="block py-2 hover:bg-gray-50/50 -mx-1 px-1 rounded transition-colors"
                {...(debugId && { 'data-debug-id': debugId })}
            >
                {/* Row 1: description + value */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${bgColor}`}
                        >
                            {icon}
                        </div>
                        <p className="text-xs font-medium text-gray-900 truncate">{description}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {valueImage && (
                            <img
                                src={valueImage}
                                alt=""
                                className="w-3 h-3 rounded-full"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        )}
                        <p className={`text-xs font-medium ${valueColor}`}>{valueWithSign}</p>
                    </div>
                </div>
                {/* Row 2: timestamp */}
                <div className="flex flex-col gap-0.5 items-end">
                    <p
                        className={`text-[10px] ${isPending ? 'text-yellow-600' : isFailed ? 'text-red-500' : 'text-gray-400'}`}
                    >
                        {statusText}
                    </p>
                    {debugId && (
                        <span className="text-[9px] font-mono text-gray-300" title={debugId}>
                            {debugId}
                        </span>
                    )}
                </div>
            </Link>
        );
    },
);

TransactionCard.displayName = 'TransactionCard';
