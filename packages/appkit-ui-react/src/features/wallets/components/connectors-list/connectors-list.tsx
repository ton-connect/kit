/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import clsx from 'clsx';

import { useConnectors } from '../../hooks/use-connectors';
import { useConnect } from '../../hooks/use-connect';
import { ConnectorItem } from '../connector-item';
import styles from './connectors-list.module.css';
import { useI18n } from '../../../../hooks/use-i18n';

export interface ConnectorsListProps {
    className?: string;
    onConnectorSelect?: (connectorId: string) => void;
}

export const ConnectorsList: FC<ConnectorsListProps> = ({ className, onConnectorSelect }) => {
    const connectors = useConnectors();
    const { mutate: connect } = useConnect();
    const { t } = useI18n();

    const handleConnect = (connectorId: string) => {
        connect({ connectorId });
        onConnectorSelect?.(connectorId);
    };

    if (connectors.length === 0) {
        return <div className={styles.emptyState}>{t('wallet.noWalletsFound')}</div>;
    }

    return (
        <div className={clsx(styles.list, className)}>
            {connectors.map((connector) => (
                <ConnectorItem
                    key={connector.id}
                    name={connector.metadata.name}
                    iconUrl={connector.metadata.iconUrl}
                    onClick={() => handleConnect(connector.id)}
                />
            ))}
        </div>
    );
};
