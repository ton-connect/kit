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

import { Modal } from '../../../../components/modal/modal';
import { Button } from '../../../../components/button';
import { useI18n } from '../../../settings/hooks/use-i18n';
import styles from './staking-settings-modal.module.css';

const ChevronsIcon: FC = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
            d="M6 13L9.29289 16.2929C9.68342 16.6834 10.3166 16.6834 10.7071 16.2929L14 13"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M14 6.58578L10.7071 3.29289C10.3166 2.90237 9.68342 2.90237 9.29289 3.29289L6 6.58578"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export interface StakingSettingsModalProps {
    open: boolean;
    onClose: () => void;
    provider: StakingProvider | undefined;
    providers: StakingProvider[];
    onProviderChange: (providerId: string) => void;
    network?: Network;
}

const nextInList = <T,>(list: readonly T[], current: T): T => {
    if (list.length === 0) return current;
    const index = list.indexOf(current);
    return list[(index + 1) % list.length] ?? current;
};

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

    const stagedProvider = useMemo(
        () => providers.find((p) => p.providerId === stagedProviderId),
        [providers, stagedProviderId],
    );
    const providerName = stagedProvider ? getProviderName(stagedProvider, network) : '—';

    const cycleProvider = () => {
        if (!stagedProvider) return;
        setStagedProviderId(nextInList(providers, stagedProvider).providerId);
    };

    const handleSave = () => {
        if (stagedProviderId && stagedProviderId !== provider?.providerId) onProviderChange(stagedProviderId);
        onClose();
    };

    return (
        <Modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()} title={t('staking.settings')}>
            <div className={styles.rows}>
                <div className={styles.row}>
                    <span className={styles.label}>{t('staking.provider')}</span>
                    <button
                        type="button"
                        className={styles.value}
                        onClick={cycleProvider}
                        disabled={providers.length <= 1}
                    >
                        {providerName}
                        <ChevronsIcon />
                    </button>
                </div>
            </div>

            <Button className={styles.saveButton} variant="fill" size="l" fullWidth onClick={handleSave}>
                {t('staking.save')}
            </Button>
        </Modal>
    );
};
