/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { Modal } from '../../../../components/modal';
import { ConnectorsList } from '../connectors-list';
import { useI18n } from '../../../../hooks/use-i18n';

export interface ChooseConnectorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChooseConnectorModal: FC<ChooseConnectorModalProps> = ({ isOpen, onClose }) => {
    const { t } = useI18n();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('wallet.connectWallet')}>
            <ConnectorsList onConnectorSelect={onClose} />
        </Modal>
    );
};
