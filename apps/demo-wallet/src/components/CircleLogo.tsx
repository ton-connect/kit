/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps } from 'react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

function CircleLogoContainer({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            data-slot="avatar"
            className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
            {...props}
        />
    );
}

function CircleLogoImage({ className, src, alt, ...props }: ComponentProps<'img'>) {
    const [error, setError] = useState(false);

    if (error || !src) {
        return null;
    }

    return (
        <img
            data-slot="avatar-image"
            className={cn('aspect-square size-full object-cover', className)}
            src={src}
            alt={alt}
            onError={() => setError(true)}
            {...props}
        />
    );
}

function CircleLogoFallback({ className, ...props }: ComponentProps<'div'>) {
    return (
        <p
            data-slot="avatar-fallback"
            className={cn(
                'bg-muted flex size-full items-center justify-center rounded-full text-sm font-bold text-blue-600',
                className,
            )}
            {...props}
        />
    );
}

export const CircleLogo = {
    Container: CircleLogoContainer,
    Image: CircleLogoImage,
    Fallback: CircleLogoFallback,
};
