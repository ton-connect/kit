/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import type { ButtonProps } from '../button';
import { Button } from '../button';
import { useConnectors, useConnect, useSelectedWallet } from '../../features/wallets';
import { useI18n } from '../../features/settings';

export const ButtonWithConnect: FC<ButtonProps> = (props) => {
    const connectors = useConnectors();
    const { mutate: connect, isPending: isConnecting } = useConnect();
    const [wallet] = useSelectedWallet();
    const isWalletConnected = wallet !== null;

    const { t } = useI18n();

    if (!isWalletConnected) {
        return (
            <Button
                {...props}
                disabled={isConnecting || connectors.length === 0}
                onClick={() => connectors[0] && connect({ connectorId: connectors[0].id })}
            >
                {t('wallet.connectWallet')}
            </Button>
        );
    }

    return <Button {...props} />;
};
