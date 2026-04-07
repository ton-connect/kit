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

export interface OnrampProviderSelectProps {
    open: boolean;
    onClose: () => void;
    providers: OnrampProvider[];
    onSelect: (provider: OnrampProvider) => void;
}

export const OnrampProviderSelect: FC<OnrampProviderSelectProps> = ({ open, onClose, providers, onSelect }) => {
    const handleSelect = (provider: OnrampProvider) => () => {
        onSelect(provider);
        onClose();
    };

    return (
        <Modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()} title="Method of purchase">
            <ul className={styles.list}>
                {providers.map((provider) => (
                    <li key={provider.id}>
                        <button type="button" className={styles.item} onClick={handleSelect(provider)}>
                            <div className={styles.logo}>{provider.name.charAt(0)}</div>
                            <div className={styles.info}>
                                <span className={styles.name}>{provider.name}</span>
                                {provider.description && (
                                    <span className={styles.description}>{provider.description}</span>
                                )}
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
        </Modal>
    );
};
