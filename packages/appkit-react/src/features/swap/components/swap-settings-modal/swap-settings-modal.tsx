/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { Modal } from '../../../../components/modal/modal';
import { useI18n } from '../../../settings/hooks/use-i18n';
import styles from './swap-settings-modal.module.css';
import { Button } from '../../../../components/button';

/** Preset slippage values in basis points */
const SLIPPAGE_PRESETS = [50, 100, 200] as const;

const WARNING_BPS = 500;

const formatSlippage = (bps: number): string => {
    return `${(bps / 100).toFixed(2)}%`;
};

export interface SwapSettingsModalProps {
    open: boolean;
    onClose: () => void;
    slippage: number;
    onSlippageChange: (bps: number) => void;
}

export const SwapSettingsModal: FC<SwapSettingsModalProps> = ({ open, onClose, slippage, onSlippageChange }) => {
    const { t } = useI18n();

    return (
        <Modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()} title={t('swap.settings')}>
            <p className={styles.label}>{t('swap.slippage')}</p>

            <div className={styles.row}>
                {SLIPPAGE_PRESETS.map((preset) => (
                    <Button
                        key={preset}
                        size="s"
                        variant={slippage === preset ? 'fill' : 'secondary'}
                        className={styles.presetBtn}
                        onClick={() => onSlippageChange(preset)}
                    >
                        {formatSlippage(preset)}
                    </Button>
                ))}
            </div>

            {slippage > WARNING_BPS && <p className={styles.warning}>{t('swap.slippageWarning')}</p>}
        </Modal>
    );
};
