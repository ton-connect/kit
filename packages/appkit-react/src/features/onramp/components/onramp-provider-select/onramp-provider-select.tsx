/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { Modal } from '../../../../components/ui/modal';
import type { OnrampProvider } from '../../types';
import styles from './onramp-provider-select.module.css';
import { OnrampProviderItem } from '../onramp-provider-item';
import { useI18n } from '../../../settings/hooks/use-i18n';

/**
 * Props for `OnrampProviderSelect`. Internal: fiat onramp is not part of the public API yet.
 */
export interface OnrampProviderSelectProps {
    /** Whether the modal is open. */
    open: boolean;
    /** Called when the modal requests to close (selection made or dismissed). */
    onClose: () => void;
    /** Onramp providers the user can pick from. */
    providers: OnrampProvider[];
    /** Called with the picked provider before the modal closes. */
    onSelect: (provider: OnrampProvider) => void;
}

/**
 * Modal listing available onramp providers as `OnrampProviderItem` rows — used to let users pick a checkout provider. Internal: fiat onramp is not part of the public API yet.
 */
export const OnrampProviderSelect: FC<OnrampProviderSelectProps> = ({ open, onClose, providers, onSelect }) => {
    const { t } = useI18n();

    const handleSelect = (provider: OnrampProvider) => () => {
        onSelect(provider);
        onClose();
    };

    return (
        <Modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()} title={t('onramp.checkout')}>
            <div className={styles.list}>
                {providers.map((provider) => (
                    <OnrampProviderItem key={provider.id} provider={provider} onClick={handleSelect(provider)} />
                ))}
            </div>
        </Modal>
    );
};
