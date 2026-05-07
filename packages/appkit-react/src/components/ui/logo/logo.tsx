/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, forwardRef, useContext, useEffect, useLayoutEffect, useState } from 'react';
import type { ComponentPropsWithoutRef, ComponentRef } from 'react';
import clsx from 'clsx';

import { useImageLoadingStatus } from './use-image-loading-status';
import type { ImageLoadingStatus } from './use-image-loading-status';
import styles from './logo.module.css';

interface LogoContextValue {
    imageLoadingStatus: ImageLoadingStatus;
    onImageLoadingStatusChange: (status: ImageLoadingStatus) => void;
}

const LogoContext = createContext<LogoContextValue | null>(null);

const useLogoContext = (): LogoContextValue => {
    const ctx = useContext(LogoContext);
    if (!ctx) throw new Error('Logo compound components must be used within Logo.Root');
    return ctx;
};

const LogoRoot = forwardRef<ComponentRef<'span'>, ComponentPropsWithoutRef<'span'>>(({ className, ...props }, ref) => {
    const [imageLoadingStatus, setImageLoadingStatus] = useState<ImageLoadingStatus>('idle');

    return (
        <LogoContext.Provider value={{ imageLoadingStatus, onImageLoadingStatusChange: setImageLoadingStatus }}>
            <span className={clsx(styles.logoRoot, className)} {...props} ref={ref} />
        </LogoContext.Provider>
    );
});

LogoRoot.displayName = 'LogoRoot';

interface LogoImageProps extends ComponentPropsWithoutRef<'img'> {
    onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
}

const LogoImage = forwardRef<ComponentRef<'img'>, LogoImageProps>(
    ({ src, onLoadingStatusChange, className, ...props }, ref) => {
        const context = useLogoContext();
        const loadingStatus = useImageLoadingStatus(src);

        useLayoutEffect(() => {
            if (loadingStatus !== 'idle') {
                onLoadingStatusChange?.(loadingStatus);
                context.onImageLoadingStatusChange(loadingStatus);
            }
        }, [loadingStatus]);

        return loadingStatus === 'loaded' ? (
            <img className={clsx(styles.logoImage, className)} {...props} ref={ref} src={src} />
        ) : null;
    },
);

LogoImage.displayName = 'LogoImage';

interface LogoFallbackProps extends ComponentPropsWithoutRef<'span'> {
    delayMs?: number;
}

const LogoFallback = forwardRef<ComponentRef<'span'>, LogoFallbackProps>(({ delayMs, className, ...props }, ref) => {
    const context = useLogoContext();
    const [canRender, setCanRender] = useState(delayMs === undefined);

    useEffect(() => {
        if (delayMs !== undefined) {
            const id = window.setTimeout(() => setCanRender(true), delayMs);
            return () => window.clearTimeout(id);
        }
        return undefined;
    }, [delayMs]);

    return canRender && context.imageLoadingStatus !== 'loaded' ? (
        <span className={clsx(styles.logoFallback, className)} {...props} ref={ref} />
    ) : null;
});

LogoFallback.displayName = 'LogoFallback';

export interface LogoProps extends ComponentPropsWithoutRef<'span'> {
    size?: number;
    src?: string;
    alt?: string;
    fallback?: string;
}

export const Logo = forwardRef<ComponentRef<'span'>, LogoProps>(({ size = 30, src, alt, fallback, ...props }, ref) => {
    return (
        <LogoRoot ref={ref} style={{ width: size, height: size }} {...props}>
            <LogoImage src={src} alt={alt} />

            {(fallback || alt) && <LogoFallback delayMs={600}>{fallback ? fallback : alt?.[0]}</LogoFallback>}
        </LogoRoot>
    );
});

Logo.displayName = 'Logo';
