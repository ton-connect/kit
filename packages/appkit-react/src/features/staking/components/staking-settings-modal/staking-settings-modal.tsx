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

/**
 * Props accepted by {@link StakingSettingsModal}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export interface StakingSettingsModalProps {
    /** Controls modal visibility. */
    open: boolean;
    /** Called when the user dismisses the modal or after a successful save. */
    onClose: () => void;
    /** Currently active staking provider — used to preselect the option when the modal opens. */
    provider: StakingProvider | undefined;
    /** All registered staking providers to choose from. */
    providers: StakingProvider[];
    /** Invoked with the chosen `providerId` when the user saves a different selection. */
    onProviderChange: (providerId: string) => void;
    /** Network used to resolve each provider's display name via its metadata. */
    network?: Network;
}

const getProviderName = (provider: StakingProvider, network?: Network): string => {
    try {
        return provider.getStakingProviderMetadata(network).name;
    } catch {
        return provider.providerId;
    }
};

/**
 * Modal that lets the user pick the active staking provider. The selection is staged locally and only committed via `onProviderChange` when the user presses `Save`; closing the modal otherwise discards the change. Each option is labeled with the provider's metadata `name`, falling back to its `providerId` if metadata is unavailable on the given network.
 *
 * @public
 * @category Component
 * @section Staking
 */
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
