/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { FC, ComponentProps } from 'react';
import clsx from 'clsx';

import styles from './connect-button.module.css';
import { Button } from '../../../../components/button';
import { useSelectedWallet } from '../../hooks/use-selected-wallet';
import { useDisconnect } from '../../hooks/use-disconnect';
import { TonIcon } from '../../../../components/ton-icon';
import { ChooseConnectorModal } from '../choose-connector-modal';
import { useI18n } from '../../../../hooks/use-i18n';
import { useConnect } from '../../hooks/use-connect';
import { useConnectors } from '../../hooks/use-connectors';

type ConnectButtonProps = Omit<ComponentProps<'button'>, 'onClick' | 'children'>;

export const ConnectButton: FC<ConnectButtonProps> = ({ className, ...props }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [wallet] = useSelectedWallet();
    const connectors = useConnectors();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();

    const { t } = useI18n();

    const onClick = () => {
        if (wallet) {
            disconnect({ connectorId: wallet.connectorId });
            return;
        }

        if (connectors.length === 1 && connectors[0]) {
            connect({ connectorId: connectors[0].id });
            return;
        }

        setIsModalOpen(true);
    };

    return (
        <>
            <Button className={clsx(styles.connectButton, className)} onClick={onClick} {...props}>
                {!wallet && <TonIcon size={14} />}
                {/* {wallet ? middleEllipsis(wallet.getAddress()) : t('wallet.connect')} */}

                {wallet ? t('wallet.disconnect') : t('wallet.connect')}
            </Button>

            <ChooseConnectorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
};
