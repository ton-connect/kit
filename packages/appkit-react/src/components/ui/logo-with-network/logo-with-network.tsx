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

/**
 * Props accepted by {@link LogoWithNetwork}.
 *
 * @public
 * @category Type
 * @section UI
 */
export interface LogoWithNetworkProps extends ComponentPropsWithoutRef<'span'> {
    /** Size of the main logo in pixels. Defaults to `30`. The network badge is sized to `size * 0.4`. */
    size?: number;
    /** Image source for the main logo. */
    src?: string;
    /** Alt text for the main logo. */
    alt?: string;
    /** Fallback text shown when the main logo image fails or is missing. */
    fallback?: string;
    /** Image source for the network badge overlay. When omitted, the badge is not rendered. */
    networkSrc?: string;
    /** Alt text for the network badge. */
    networkAlt?: string;
}

/**
 * Token logo with an overlaid network badge — wraps {@link Logo} and renders a smaller secondary logo as a corner badge to indicate which network the asset belongs to.
 *
 * @public
 * @category Component
 * @section UI
 */
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
