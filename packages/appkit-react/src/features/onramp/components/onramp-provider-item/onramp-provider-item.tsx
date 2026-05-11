/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';
import clsx from 'clsx';

import type { OnrampProvider } from '../../types';
import { Logo } from '../../../../components/ui/logo';
import styles from './onramp-provider-item.module.css';

/**
 * Props for `OnrampProviderItem` — extends native `<button>` props with the provider to render. Internal: fiat onramp is not part of the public API yet.
 */
export interface OnrampProviderItemProps extends ComponentProps<'button'> {
    /** Onramp provider to render — logo, name and description are taken from `OnrampProvider`. */
    provider: OnrampProvider;
}

/**
 * Button-row component rendering a single `OnrampProvider` (logo, name, description) — used inside `OnrampProviderSelect`. Internal: fiat onramp is not part of the public API yet.
 */
export const OnrampProviderItem: FC<OnrampProviderItemProps> = ({ provider, className, ...props }) => {
    return (
        <button type="button" className={clsx(styles.container, className)} {...props}>
            <Logo
                className={styles.icon}
                size={40}
                src={provider.logo}
                fallback={provider.name[0]}
                alt={provider.name}
            />
            <div className={styles.info}>
                <div className={styles.name}>{provider.name}</div>
                <div className={styles.methods}>{provider.description}</div>
            </div>
        </button>
    );
};
