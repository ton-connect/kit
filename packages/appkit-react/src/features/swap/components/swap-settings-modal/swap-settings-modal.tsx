/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import type { SwapProvider } from '@ton/appkit';

import { Modal } from '../../../../components/ui/modal/modal';
import { Button } from '../../../../components/ui/button';
import { ChevronsIcon } from '../../../../components/ui/icons';
import { useI18n } from '../../../settings/hooks/use-i18n';
import styles from './swap-settings-modal.module.css';

/** Preset slippage values in basis points */
const SLIPPAGE_PRESETS = [50, 100, 200] as const;

const formatSlippage = (bps: number): string => `${(bps / 100).toFixed(2)}%`;

export interface SwapSettingsModalProps {
    open: boolean;
    onClose: () => void;
    slippage: number;
    onSlippageChange: (bps: number) => void;
    provider: SwapProvider | undefined;
    providers: SwapProvider[];
    onProviderChange: (providerId: string) => void;
}

const nextInList = <T,>(list: readonly T[], current: T): T => {
    if (list.length === 0) return current;
    const index = list.indexOf(current);
    return list[(index + 1) % list.length] ?? current;
};

export const SwapSettingsModal: FC<SwapSettingsModalProps> = ({
    open,
    onClose,
    slippage,
    onSlippageChange,
    provider,
    providers,
    onProviderChange,
}) => {
    const { t } = useI18n();

    const [stagedProviderId, setStagedProviderId] = useState<string | undefined>(provider?.providerId);
    const [stagedSlippage, setStagedSlippage] = useState(slippage);

    // Reset the staged values each time the modal reopens so values from an abandoned
    // session don't leak into the next one.
    useEffect(() => {
        if (open) {
            setStagedProviderId(provider?.providerId);
            setStagedSlippage(slippage);
        }
    }, [open, provider?.providerId, slippage]);

    const stagedProvider = useMemo(
        () => providers.find((p) => p.providerId === stagedProviderId),
        [providers, stagedProviderId],
    );
    const providerName = stagedProvider?.getMetadata().name ?? '—';

    const cycleProvider = () => {
        if (!stagedProvider) return;
        setStagedProviderId(nextInList(providers, stagedProvider).providerId);
    };

    const cycleSlippage = () => {
        setStagedSlippage(nextInList(SLIPPAGE_PRESETS as readonly number[], stagedSlippage));
    };

    const handleSave = () => {
        if (stagedSlippage !== slippage) onSlippageChange(stagedSlippage);
        if (stagedProviderId && stagedProviderId !== provider?.providerId) onProviderChange(stagedProviderId);
        onClose();
    };

    return (
        <Modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()} title={t('swap.settings')}>
            <div className={styles.rows}>
                <div className={styles.row}>
                    <span className={styles.label}>{t('swap.provider')}</span>
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

                <div className={styles.row}>
                    <span className={styles.label}>{t('swap.slippage')}</span>
                    <button type="button" className={styles.value} onClick={cycleSlippage}>
                        {formatSlippage(stagedSlippage)}
                        <ChevronsIcon />
                    </button>
                </div>
            </div>

            <Button className={styles.saveButton} variant="fill" size="l" fullWidth onClick={handleSave}>
                {t('swap.save')}
            </Button>
        </Modal>
    );
};
