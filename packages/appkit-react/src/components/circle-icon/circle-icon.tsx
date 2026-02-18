/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ComponentProps } from 'react';
import clsx from 'clsx';
import { Avatar } from 'radix-ui';

import styles from './circle-icon.module.css';

export interface CircleIconProps extends ComponentProps<'div'> {
    size?: number;
    src?: string;
    alt?: string;
    fallback?: string;
}

export const CircleIcon: FC<CircleIconProps> = ({ className, size = 30, src, alt, fallback, ...props }) => {
    return (
        <Avatar.Root className={clsx(styles.avatarRoot, className)} style={{ width: size, height: size }} {...props}>
            <Avatar.Image className={styles.avatarImage} src={src} alt={alt} />

            {(fallback || alt) && (
                <Avatar.Fallback className={styles.avatarFallback} delayMs={600}>
                    {fallback ? fallback : alt?.[0]}
                </Avatar.Fallback>
            )}
        </Avatar.Root>
    );
};
