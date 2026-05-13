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
import { OptionSwitcher } from '../../../../components/shared/option-switcher';
import { useI18n } from '../../../settings/hooks/use-i18n';
import styles from './swap-settings-modal.module.css';

/** Preset slippage values in basis points */
const SLIPPAGE_PRESETS = [50, 100, 200] as const;

const formatSlippage = (bps: number): string => `${(bps / 100).toFixed(2)}%`;

const SLIPPAGE_OPTIONS = SLIPPAGE_PRESETS.map((bps) => ({ value: String(bps), label: formatSlippage(bps) }));

/**
 * Props accepted by `SwapSettingsModal` — the modal that lets the user pick a {@link appkit:SwapProvider} and a slippage preset before confirming a swap.
 *
 * @public
 * @category Type
 * @section Swap
 */
export interface SwapSettingsModalProps {
    /** Controls modal visibility. */
    open: boolean;
    /** Called when the user dismisses the modal (close icon, overlay click, or after pressing "save"). */
    onClose: () => void;
    /** Current slippage tolerance in basis points (`100` = 1%). Seeds the staged value when the modal opens. */
    slippage: number;
    /** Called with the newly selected slippage in basis points when the user presses "save". */
    onSlippageChange: (bps: number) => void;
    /** Currently active swap provider. Its `providerId` seeds the staged selection. */
    provider: SwapProvider | undefined;
    /** All swap providers available for selection — each gets a switcher option. */
    providers: SwapProvider[];
    /** Called with the newly selected `providerId` when the user presses "save". */
    onProviderChange: (providerId: string) => void;
}

/**
 * Modal that exposes per-swap settings: the {@link appkit:SwapProvider} and a slippage preset. Selections are staged locally and committed via `onSlippageChange` / `onProviderChange` only when the user presses "save". Closing without saving discards them.
 *
 * @public
 * @category Component
 * @section Swap
 */
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

    const providerOptions = useMemo(
        () => providers.map((p) => ({ value: p.providerId, label: p.getMetadata().name })),
        [providers],
    );

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
                    <OptionSwitcher value={stagedProviderId} options={providerOptions} onChange={setStagedProviderId} />
                </div>
                <div className={styles.row}>
                    <span className={styles.label}>{t('swap.slippage')}</span>
                    <OptionSwitcher
                        value={String(stagedSlippage)}
                        options={SLIPPAGE_OPTIONS}
                        onChange={(v) => setStagedSlippage(Number(v))}
                    />
                </div>
            </div>

            <Button className={styles.saveButton} variant="fill" size="l" fullWidth onClick={handleSave}>
                {t('swap.save')}
            </Button>
        </Modal>
    );
};
