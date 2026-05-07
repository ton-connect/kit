/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useRef, useLayoutEffect, useState } from 'react';
import type { FC, ComponentProps } from 'react';

import styles from './collapsible.module.css';

export interface CollapsibleProps extends ComponentProps<'div'> {
    open: boolean;
}

export const Collapsible: FC<CollapsibleProps> = ({ open, children, ...props }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number | undefined>(open ? undefined : 0);

    useLayoutEffect(() => {
        const el = contentRef.current;
        if (!el) return undefined;

        if (open) {
            setHeight(el.scrollHeight);

            const onEnd = () => setHeight(undefined);
            el.addEventListener('transitionend', onEnd, { once: true });
            return () => el.removeEventListener('transitionend', onEnd);
        }

        setHeight(el.scrollHeight);
        const id = requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setHeight(0);
            });
        });
        return () => cancelAnimationFrame(id);
    }, [open]);

    return (
        <div
            ref={contentRef}
            className={styles.collapsible}
            style={{ height: height !== undefined ? `${height}px` : undefined }}
            aria-hidden={!open}
            {...props}
        >
            {children}
        </div>
    );
};
