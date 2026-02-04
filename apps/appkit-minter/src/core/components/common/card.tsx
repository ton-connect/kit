/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ComponentProps } from 'react';

import { cn } from '@/core/lib/utils';

interface CardProps extends ComponentProps<'div'> {
    title?: string;
}

export const Card: FC<CardProps> = ({ children, className, title, ...props }) => {
    return (
        <div
            className={cn('bg-card rounded-xl shadow-md border border-border text-card-foreground', className)}
            {...props}
        >
            {title && (
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                </div>
            )}

            <div className="p-6">{children}</div>
        </div>
    );
};
