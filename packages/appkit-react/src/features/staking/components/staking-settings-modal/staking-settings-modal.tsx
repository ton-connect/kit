/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import type { Network, StakingProvider } from '@ton/appkit';

import { Modal } from '../../../../components/ui/modal/modal';
import { Button } from '../../../../components/ui/button';
import { OptionSwitcher } from '../../../../components/shared/option-switcher';
import { useI18n } from '../../../settings/hooks/use-i18n';
import styles from './staking-settings-modal.module.css';

export interface StakingSettingsModalProps {
    open: boolean;
    onClose: () => void;
    provider: StakingProvider | undefined;
    providers: StakingProvider[];
    onProviderChange: (providerId: string) => void;
    network?: Network;
}

const getProviderName = (provider: StakingProvider, network?: Network): string => {
    try {
        return provider.getStakingProviderMetadata(network).name;
    } catch {
        return provider.providerId;
    }
};

export const StakingSettingsModal: FC<StakingSettingsModalProps> = ({
    open,
    onClose,
    provider,
    providers,
    onProviderChange,
    network,
}) => {
    const { t } = useI18n();

    const [stagedProviderId, setStagedProviderId] = useState<string | undefined>(provider?.providerId);

    useEffect(() => {
        if (open) setStagedProviderId(provider?.providerId);
    }, [open, provider?.providerId]);

    const providerOptions = useMemo(
        () => providers.map((p) => ({ value: p.providerId, label: getProviderName(p, network) })),
        [providers, network],
    );

    const handleSave = () => {
        if (stagedProviderId && stagedProviderId !== provider?.providerId) onProviderChange(stagedProviderId);
        onClose();
    };

    return (
        <Modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()} title={t('staking.settings')}>
            <div className={styles.rows}>
                <div className={styles.row}>
                    <span className={styles.label}>{t('staking.provider')}</span>
                    <OptionSwitcher value={stagedProviderId} options={providerOptions} onChange={setStagedProviderId} />
                </div>
            </div>

            <Button className={styles.saveButton} variant="fill" size="l" fullWidth onClick={handleSave}>
                {t('staking.save')}
            </Button>
        </Modal>
    );
};
