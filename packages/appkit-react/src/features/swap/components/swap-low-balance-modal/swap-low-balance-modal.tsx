/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { Modal } from '../../../../components/modal/modal';
import { Button } from '../../../../components/button';
import { useI18n } from '../../../settings/hooks/use-i18n';
import styles from './swap-low-balance-modal.module.css';

export type SwapLowBalanceMode = 'reduce' | 'topup';

export interface SwapLowBalanceModalProps {
    open: boolean;
    /**
     * `reduce` — fromToken is TON, user can fix by reducing the amount (shows Change/Cancel).
     * `topup`  — fromToken is a jetton, reducing doesn't help (shows Close only).
     */
    mode: SwapLowBalanceMode;
    /** Required amount in TON, formatted as a decimal string (e.g. "0.423"). */
    requiredTon: string;
    onChange: () => void;
    onCancel: () => void;
}

export const SwapLowBalanceModal: FC<SwapLowBalanceModalProps> = ({ open, mode, requiredTon, onChange, onCancel }) => {
    const { t } = useI18n();

    const messageKey = mode === 'reduce' ? 'swap.lowBalanceMessageReduce' : 'swap.lowBalanceMessageTopup';

    return (
        <Modal open={open} onOpenChange={(isOpen) => !isOpen && onCancel()} title={t('swap.lowBalanceTitle')}>
            <p className={styles.message}>{t(messageKey, { amount: requiredTon })}</p>

            <div className={styles.actions}>
                {mode === 'reduce' ? (
                    <>
                        <Button variant="secondary" size="l" fullWidth onClick={onCancel}>
                            {t('swap.lowBalanceCancel')}
                        </Button>
                        <Button variant="fill" size="l" fullWidth onClick={onChange}>
                            {t('swap.lowBalanceChange')}
                        </Button>
                    </>
                ) : (
                    <Button variant="fill" size="l" fullWidth onClick={onCancel}>
                        {t('swap.lowBalanceClose')}
                    </Button>
                )}
            </div>
        </Modal>
    );
};
