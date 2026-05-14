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
import { TokenSelector } from '../../../../components/shared/token-selector';
import { useI18n } from '../../../settings/hooks/use-i18n';

/**
 * Props for {@link OnrampTokenSelectors} — extends native `<div>` props with the from/to display state and click handlers.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export interface OnrampTokenSelectorsProps extends ComponentProps<'div'> {
    /** Source side — the token being bought. Rendered with the "buy {symbol}" label. (`network`/`networkLogoSrc` fields are accepted for symmetry with `to` but are not surfaced on the `from` selector.) */
    from: { title: string; logoSrc?: string; network?: string; networkLogoSrc?: string };
    /** Target side — the payment method/currency. Rendered with the "for {symbol}" label and an optional `networkLogoSrc` badge. */
    to: { title: string; logoSrc?: string; network?: string; networkLogoSrc?: string };
    /** Called when the user clicks the source selector — typically opens the token picker. */
    onFromClick: () => void;
    /** Called when the user clicks the target selector — typically opens the method/currency picker. */
    onToClick: () => void;
}

/**
 * Side-by-side from/to token selectors used at the top of onramp widgets — pairs a "buy {token}" selector with a "for {method}" selector, each clickable to open the matching picker.
 *
 * @public
 * @category Component
 * @section Crypto Onramp
 */
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
                networkIcon={to.networkLogoSrc}
                onClick={onToClick}
            />
        </div>
    );
};
