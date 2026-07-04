/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { Check, MinusCircle, PlusCircle, X } from 'lucide-react';

import type { TransactionRowModel, TransactionRowStatus } from '../../utils/map-transaction-row';

import { Skeleton } from '@/core/components/ui/skeleton';

const StatusBadge: React.FC<{ status: TransactionRowStatus }> = ({ status }) => {
    const base =
        'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white';

    if (status === 'success') {
        return (
            <span className={`${base} bg-green-500`}>
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </span>
        );
    }
    if (status === 'failed') {
        return (
            <span className={`${base} bg-red-500`}>
                <X className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </span>
        );
    }
    return (
        <span className={`${base} bg-white`} title="Pending">
            <span className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" />
        </span>
    );
};

/** Single transaction list item. Reused by the dashboard preview and the full history page. */
export const TransactionRow: React.FC<TransactionRowModel> = ({
    explorerUrl,
    title,
    subtitleId,
    amount,
    isOutgoing,
    status,
    date,
}) => {
    const content = (
        <>
            <span className="relative w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                {isOutgoing ? (
                    <MinusCircle className="w-6 h-6 text-gray-400" strokeWidth={2} />
                ) : (
                    <PlusCircle className="w-6 h-6 text-gray-400" strokeWidth={2} />
                )}
                <StatusBadge status={status} />
            </span>

            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>
                <div className="text-xs text-gray-500 truncate">{subtitleId}</div>
            </div>

            <div className="text-right flex-shrink-0">
                <div className={`text-sm font-semibold ${isOutgoing ? 'text-red-500' : 'text-green-500'}`}>
                    {amount}
                </div>
                <div className="text-xs text-gray-400">{date}</div>
            </div>
        </>
    );

    const rowClassName = 'flex items-center gap-3 py-2 -mx-1 px-1 rounded-xl';

    if (!explorerUrl) {
        return <div className={rowClassName}>{content}</div>;
    }

    return (
        <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${rowClassName} hover:bg-gray-50 transition-colors`}
        >
            {content}
        </a>
    );
};

/** Loading placeholder mirroring {@link TransactionRow}: circular icon, title/id lines, amount/date. */
export const TransactionRowSkeleton: React.FC = () => (
    <div className="flex items-center gap-3 py-2 -mx-1 px-1">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
        </div>
        <div className="text-right space-y-1.5">
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-3 w-12 ml-auto" />
        </div>
    </div>
);
