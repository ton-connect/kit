/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { memo } from 'react';
import type { Action } from '@ton/walletkit';

import { formatTimestamp } from '../../utils';

interface ActionCardProps {
    action: Action;
    myAddress: string;
    timestamp: number;
    traceLink: string;
    isPending?: boolean;
}

/**
 * Universal component for displaying any blockchain action
 * Uses Action.simplePreview and Action.status for rendering
 */
export const ActionCard: React.FC<ActionCardProps> = memo(
    ({ action, myAddress, timestamp, traceLink, isPending = false }) => {
        const { simplePreview, status } = action;
        const { description, value, accounts, valueImage } = simplePreview;

        // Determine if this is an outgoing action by checking if myAddress is the first account (sender)
        const isOutgoing = accounts.length > 0 && accounts[0]?.address === myAddress;
        const isFailed = status === 'failure';

        // Determine icon and color based on action type and status
        const getIconAndColor = () => {
            if (isFailed) {
                return {
                    bgColor: 'bg-red-100',
                    iconColor: 'text-red-600',
                    icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    iconColor: 'text-red-600',
                    icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                iconColor: 'text-green-600',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 13l-5 5m0 0l-5-5m5 5V6"
                        />
                    </svg>
                ),
            };
        };

        const { bgColor, iconColor, icon } = getIconAndColor();

        return (
            <a
                href={traceLink}
                className={`flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border ${
                    isPending ? 'border-yellow-300 bg-yellow-50 animate-pulse' : 'border-gray-100'
                }`}
            >
                <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgColor}`}>
                        {isPending ? (
                            <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <div className={iconColor}>{icon}</div>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            {isPending && <span className="text-yellow-600 mr-1">⏳</span>}
                            {description}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                        {valueImage && (
                            <img
                                src={valueImage}
                                alt=""
                                className="w-4 h-4 rounded-full"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        )}
                        <p
                            className={`text-sm font-medium ${
                                isPending
                                    ? 'text-yellow-600'
                                    : isFailed
                                      ? 'text-red-600'
                                      : isOutgoing
                                        ? 'text-red-600'
                                        : 'text-green-600'
                            }`}
                        >
                            {!isFailed && !isPending && (isOutgoing ? '-' : '+')}
                            {value}
                        </p>
                    </div>
                    <p
                        className={`text-xs ${
                            isPending
                                ? 'text-yellow-600 font-medium'
                                : status === 'success'
                                  ? 'text-gray-400'
                                  : 'text-red-500'
                        }`}
                    >
                        {isPending ? 'Pending...' : status === 'success' ? formatTimestamp(timestamp) : 'Failed'}
                    </p>
                </div>
            </a>
        );
    },
);
