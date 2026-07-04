/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { TransactionRow, TransactionRowSkeleton } from '../transaction-row';
import { useTransactionRows } from '../../hooks/use-transaction-rows';

const PREVIEW_COUNT = 6;
const SKELETON_ROWS = 4;

/**
 * Dashboard "History" block: the latest transactions (first page fetched at the shared
 * page size, only the first {@link PREVIEW_COUNT} shown). Shows shimmer rows while the
 * first fetch is in flight; hides the whole block on a load error (so we never shimmer
 * forever); shows a small "No transactions yet" stub for a genuinely empty wallet. The
 * header navigates to the full history page.
 */
export const TransactionHistory: React.FC = () => {
    const navigate = useNavigate();
    // No explicit page size: uses the shared EVENTS_PAGE_SIZE (25) so this collapses onto
    // the history page's first-page request. We still render only PREVIEW_COUNT rows.
    const { rows, showEmpty, isError } = useTransactionRows();
    const preview = rows.slice(0, PREVIEW_COUNT);

    // On a load error, hide the whole block rather than shimmering forever.
    if (isError) {
        return null;
    }

    return (
        <section>
            <button
                type="button"
                onClick={() => navigate('/wallet/history')}
                className="mb-2 flex items-center gap-1"
                aria-label="View all transactions"
            >
                <h2 className="text-base font-semibold text-gray-900">History</h2>
                <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>

            <div className="space-y-1">
                {preview.length > 0 ? (
                    preview.map((row) => <TransactionRow key={row.id} {...row} />)
                ) : showEmpty ? (
                    // Genuinely-empty wallet: a small stub instead of hiding the section.
                    <p className="py-4 text-center text-sm text-gray-400">No transactions yet</p>
                ) : (
                    Array.from({ length: SKELETON_ROWS }).map((_, index) => (
                        <TransactionRowSkeleton key={index} />
                    ))
                )}
            </div>
        </section>
    );
};
