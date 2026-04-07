/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ComponentProps } from 'react';
import clsx from 'clsx';

import styles from './onramp-token-selectors.module.css';
import { TokenSelector } from '../../../../components/token-selector';

export interface OnrampTokenSelectorsProps extends ComponentProps<'div'> {
    from: { title: string; logoSrc?: string };
    to: { title: string; logoSrc?: string };
    onFromClick: () => void;
    onToClick: () => void;
}

export const OnrampTokenSelectors: FC<OnrampTokenSelectorsProps> = ({
    from,
    to,
    onFromClick,
    onToClick,
    className,
    ...props
}) => {
    return (
        <div className={clsx(styles.container, className)} {...props}>
            <TokenSelector
                size="m"
                className={styles.tokenSelector}
                title={`Buy ${from.title}`}
                icon={from.logoSrc}
                onClick={onFromClick}
            />

            <TokenSelector
                size="m"
                className={styles.tokenSelector}
                title={`for ${to.title}`}
                icon={to.logoSrc}
                onClick={onToClick}
            />
        </div>
    );
};
