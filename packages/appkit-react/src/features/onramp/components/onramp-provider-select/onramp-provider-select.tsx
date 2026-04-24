/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { Modal } from '../../../../components/modal';
import type { OnrampProvider } from '../../types';
import styles from './onramp-provider-select.module.css';
import { OnrampProviderItem } from '../onramp-provider-item';
import { useI18n } from '../../../settings/hooks/use-i18n';

export interface OnrampProviderSelectProps {
    open: boolean;
    onClose: () => void;
    providers: OnrampProvider[];
    onSelect: (provider: OnrampProvider) => void;
}

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
