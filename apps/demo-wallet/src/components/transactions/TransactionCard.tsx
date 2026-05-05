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

export type TxFinality = 'pending' | 'confirmed' | 'finalized' | 'invalidated' | 'done';

export interface TransactionCardProps {
    description: string;
    value: string;
    valueImage?: string;
    timestamp: number;
    traceLink?: string;
    status: 'pending' | 'success' | 'failure';
    /** Finality for status badge: pending, confirmed, finalized, or done (default: pending when status=pending, else done) */
    finality?: TxFinality;
    isOutgoing?: boolean;
    /** Debug ID for DOM inspection (data-debug-id) */
    debugId?: string;
}

const StatusBadge: React.FC<{ finality: TxFinality; isFailed?: boolean }> = ({ finality, isFailed }) => {
    const base =
        'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full flex items-center justify-center ring-1 ring-white';
    if (isFailed) {
        return (
            <div className={`${base} bg-red-500`} title="Failed">
                <svg className="w-1.5 h-1.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
        );
    }
    if (finality === 'pending') {
        return (
            <div className={`${base} bg-yellow-400`}>
                <div className="w-1.5 h-1.5 border border-yellow-700 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    if (finality === 'confirmed') {
        return (
            <div className={`${base} bg-blue-400`} title="Confirmed">
                <svg className="w-1.5 h-1.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="8" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
            </div>
        );
    }
    if (finality === 'finalized') {
        return (
            <div className={`${base} bg-indigo-500`} title="Finalized">
                <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                    />
                </svg>
            </div>
        );
    }
    if (finality === 'invalidated') {
        return (
            <div className={`${base} bg-red-400`} title="Invalidated">
                <svg className="w-1.5 h-1.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
        );
    }
    // done - no badge
    return null;
};

/**
 * Unified card for pending and confirmed transactions.
 * Main icon: always send/receive. Status badge: small icon in corner.
 */
export const TransactionCard: React.FC<TransactionCardProps> = memo(
    ({
        description,
        value,
        valueImage,
        timestamp,
        traceLink,
        status,
        finality: finalityProp,
        isOutgoing = false,
        debugId,
    }) => {
        const isFailed = status === 'failure';
        const isPending = status === 'pending';

        const finality: TxFinality = finalityProp ?? (isPending ? 'pending' : isFailed ? 'done' : 'done');

        // Main icon: always send (up) or receive (down) based on direction
        const mainIcon = (() => {
            if (isFailed) {
                return (
                    <svg className="w-2.5 h-2.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            }
            if (isOutgoing) {
                return (
                    <svg className="w-2.5 h-2.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 11l5-5m0 0l5 5m-5-5v12"
                        />
                    </svg>
                );
            }
            return (
                <svg className="w-2.5 h-2.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
            );
        })();

        const bgColor = isFailed ? 'bg-red-100' : isOutgoing ? 'bg-red-100' : 'bg-green-100';
        const valueColor = isFailed ? 'text-red-600' : isOutgoing ? 'text-red-600' : 'text-green-600';
        const valueWithSign = isFailed ? value : isOutgoing ? `-${value}` : `+${value}`;

        const statusText =
            finality === 'pending'
                ? 'Pending'
                : finality === 'confirmed'
                  ? 'Confirmed'
                  : finality === 'finalized'
                    ? 'Finalized'
                    : finality === 'invalidated'
                      ? 'Invalidated'
                      : isFailed
                        ? 'Failed'
                        : formatTimestamp(timestamp);

        const statusColor =
            finality === 'pending'
                ? 'text-yellow-600'
                : finality === 'confirmed'
                  ? 'text-blue-600'
                  : finality === 'finalized'
                    ? 'text-indigo-600'
                    : finality === 'invalidated'
                      ? 'text-red-600'
                      : isFailed
                        ? 'text-red-500'
                        : 'text-gray-400';

        const inner = (
            <>
                {/* Row 1: description + value */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                            className={`relative w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${bgColor}`}
                        >
                            {mainIcon}
                            {(finality !== 'done' || isFailed) && (
                                <StatusBadge finality={finality} isFailed={isFailed} />
                            )}
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
                    <p className={`text-[10px] ${statusColor}`}>{statusText}</p>
                    {debugId && (
                        <span className="text-[9px] font-mono text-gray-300" title={debugId}>
                            {debugId}
                        </span>
                    )}
                </div>
            </>
        );

        if (!traceLink) {
            return (
                <div className="block py-2 -mx-1 px-1 rounded" {...(debugId && { 'data-debug-id': debugId })}>
                    {inner}
                </div>
            );
        }

        return (
            <Link
                to={traceLink}
                className="block py-2 hover:bg-gray-50/50 -mx-1 px-1 rounded transition-colors"
                {...(debugId && { 'data-debug-id': debugId })}
            >
                {inner}
            </Link>
        );
    },
);

TransactionCard.displayName = 'TransactionCard';
