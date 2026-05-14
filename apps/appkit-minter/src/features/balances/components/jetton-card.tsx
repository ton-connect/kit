/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';
import { formatLargeValue, Logo } from '@ton/appkit-react';

import { cn } from '@/core/lib/utils';
import { truncateAddress } from '@/core/utils/truncate-address';

interface JettonCardProps extends Omit<ComponentProps<'button'>, 'onClick'> {
    ticker: string;
    balance: string;
    address: 'ton' | string;
    name?: string;
    image?: string;
    onClick?: () => void;
    isLastItem?: boolean;
}

export const JettonCard: FC<JettonCardProps> = ({
    ticker,
    name,
    image,
    balance,
    address,
    onClick,
    className,
    isLastItem,
    ...props
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex items-center justify-between gap-3 px-2 py-4 text-center transition-colors hover:bg-secondary/30',
                !isLastItem && 'border-b',
                className,
            )}
            {...props}
        >
            <div className="flex items-center gap-2">
                <Logo size={40} src={image} alt={name ?? ticker} fallback={ticker[0]} />

                <div className="flex flex-col text-left">
                    <p className="text-md font-bold text-foreground">{name || ticker}</p>

                    <p className="text-sm font-medium leading-tight text-secondary-foreground">
                        {address === 'ton' ? 'Native' : truncateAddress(address)}
                    </p>
                </div>
            </div>

            <div className="flex flex-col text-right">
                <p className="text-md font-bold text-foreground">{formatLargeValue(balance, 4)}</p>
                <p className="text-sm font-medium leading-tight text-secondary-foreground">{ticker}</p>
            </div>
        </button>
    );
};
