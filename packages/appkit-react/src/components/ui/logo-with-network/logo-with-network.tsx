/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ComponentRef } from 'react';
import clsx from 'clsx';

import { Logo } from '../logo';
import styles from './logo-with-network.module.css';

export interface LogoWithNetworkProps extends ComponentPropsWithoutRef<'span'> {
    /** Size of the main logo in pixels */
    size?: number;
    /** Image source for the main logo */
    src?: string;
    /** Alt text for the main logo */
    alt?: string;
    /** Fallback text for the main logo */
    fallback?: string;
    /** Image source for the network badge */
    networkSrc?: string;
    /** Alt text for the network badge */
    networkAlt?: string;
}

export const LogoWithNetwork = forwardRef<ComponentRef<'span'>, LogoWithNetworkProps>(
    ({ size = 30, src, alt, fallback, networkSrc, networkAlt, className, ...props }, ref) => {
        return (
            <span ref={ref} className={clsx(styles.root, className)} {...props}>
                <Logo size={size} src={src} alt={alt} fallback={fallback} />
                {!!networkSrc && (
                    <span className={styles.networkBadge}>
                        <Logo size={size * 0.4} src={networkSrc} alt={networkAlt} fallback={networkAlt?.[0]} />
                    </span>
                )}
            </span>
        );
    },
);

LogoWithNetwork.displayName = 'LogoWithNetwork';
