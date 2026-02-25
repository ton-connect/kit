/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { clsx } from 'clsx';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { TransactionStatus as AppKitTransactionStatus } from '@ton/appkit-react';

export interface TransactionStatusProps {
    boc: string;
    className?: string;
}

export const TransactionStatus = ({ boc, className }: TransactionStatusProps) => {
    const getStatusColor = (s?: string) => {
        switch (s) {
            case 'completed':
                return 'text-green-500';
            case 'failed':
                return 'text-red-500';
            case 'pending':
                return 'text-yellow-500';
            default:
                return 'text-gray-500';
        }
    };

    const getStatusIcon = (s?: string) => {
        switch (s) {
            case 'completed':
                return <CheckCircle2 className="w-6 h-6 text-green-500" />;
            case 'failed':
                return <XCircle className="w-6 h-6 text-red-500" />;
            case 'pending':
                return <Clock className="w-6 h-6 text-yellow-500 animate-pulse" />;
            default:
                return <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />;
        }
    };

    return (
        <AppKitTransactionStatus boc={boc}>
            {({ status, totalMessages, onchainMessages, pendingMessages, error, isFetching }) => {
                if (error) {
                    return (
                        <div className="p-4 rounded-lg bg-red-500/10 text-red-500 text-sm">
                            Error checking transaction: {error instanceof Error ? error.message : 'Unknown error'}
                        </div>
                    );
                }

                if (isFetching && status === 'pending' && totalMessages === 0) {
                    return (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    );
                }

                return (
                    <div className={clsx('space-y-4', className)}>
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Status</span>
                            <div className="flex items-center gap-2">
                                {getStatusIcon(status)}
                                <span className={clsx('font-bold uppercase', getStatusColor(status))}>{status}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="text-2xl font-bold">{totalMessages}</div>
                                <div className="text-xs text-muted-foreground uppercase">Total</div>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="text-2xl font-bold text-green-500">{onchainMessages}</div>
                                <div className="text-xs text-muted-foreground uppercase">Onchain</div>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="text-2xl font-bold text-yellow-500">{pendingMessages}</div>
                                <div className="text-xs text-muted-foreground uppercase">Pending</div>
                            </div>
                        </div>
                    </div>
                );
            }}
        </AppKitTransactionStatus>
    );
};
