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
import { useI18n } from '../../../settings/hooks/use-i18n';

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
    const { t } = useI18n();

    return (
        <div className={clsx(styles.container, className)} {...props}>
            <TokenSelector
                size="m"
                variant="secondary"
                className={styles.tokenSelector}
                title={t('onramp.buyToken', { symbol: from.title })}
                icon={from.logoSrc}
                onClick={onFromClick}
            />

            <TokenSelector
                size="m"
                variant="secondary"
                className={styles.tokenSelector}
                title={t('onramp.forCurrency', { symbol: to.title })}
                icon={to.logoSrc}
                onClick={onToClick}
            />
        </div>
    );
};
