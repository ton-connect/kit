/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { TransactionRow, TransactionRowSkeleton } from '../transaction-row';
import { useTransactionRows } from '../../hooks/use-transaction-rows';

import { Button } from '@/core/components/ui/button';
import { NewLayout } from '@/core/components/shared/new-layout';
import { ScreenHeader } from '@/core/components/shared/screen-header';

const SKELETON_ROWS = 8;

/**
 * Full transaction history page: all transactions with offset-based "Load more" pagination
 * (each page appends to the list — see use-transaction-rows). On a first-page load error we
 * show a short error line instead of an endless shimmer.
 */
export const HistoryScreen: FC = () => {
    const navigate = useNavigate();
    const { rows, hasMore, isLoading, showEmpty, isError, loadMore } = useTransactionRows();

    // With rows already on screen, `isLoading` means the next offset page is being fetched.
    const isLoadingMore = isLoading && rows.length > 0;

    return (
        <NewLayout header={<ScreenHeader title="History" onBack={() => navigate('/wallet')} />}>
            {rows.length > 0 ? (
                <div className="space-y-1">
                    {rows.map((row) => (
                        <TransactionRow key={row.id} {...row} />
                    ))}
                </div>
            ) : isError ? (
                <p className="py-12 text-center text-sm text-gray-400">Unable to load transactions</p>
            ) : showEmpty ? (
                <p className="py-12 text-center text-sm text-gray-400">No transactions yet</p>
            ) : (
                // Loading first page: show a shimmer, never a false "empty".
                <div className="space-y-1">
                    {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
                        <TransactionRowSkeleton key={index} />
                    ))}
                </div>
            )}

            {hasMore && rows.length > 0 && (
                <div className="mt-4 flex justify-center">
                    <Button
                        variant="secondary"
                        size="sm"
                        loading={isLoadingMore}
                        onClick={loadMore}
                        className="transition-transform active:scale-95 active:bg-blue-100"
                    >
                        Load more
                    </Button>
                </div>
            )}
        </NewLayout>
    );
};
