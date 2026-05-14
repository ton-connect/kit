/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { Modal } from '../../ui/modal/modal';
import { Button } from '../../ui/button';
import { useI18n } from '../../../features/settings/hooks/use-i18n';
import styles from './low-balance-modal.module.css';

export type LowBalanceMode = 'reduce' | 'topup';

export interface LowBalanceModalProps {
    open: boolean;
    /**
     * `reduce` — user can fix it by reducing the amount (shows Change/Cancel).
     * `topup`  — reducing doesn't help, user must top up TON (shows Close only).
     */
    mode: LowBalanceMode;
    /** Required amount in TON, formatted as a decimal string (e.g. "0.423"). */
    requiredTon: string;
    onChange: () => void;
    onCancel: () => void;
}

export const LowBalanceModal: FC<LowBalanceModalProps> = ({ open, mode, requiredTon, onChange, onCancel }) => {
    const { t } = useI18n();

    const messageKey = mode === 'reduce' ? 'lowBalance.messageReduce' : 'lowBalance.messageTopup';

    return (
        <Modal open={open} onOpenChange={(isOpen) => !isOpen && onCancel()} title={t('lowBalance.title')}>
            <p className={styles.message}>{t(messageKey, { amount: requiredTon })}</p>

            <div className={styles.actions}>
                {mode === 'reduce' ? (
                    <>
                        <Button variant="secondary" size="l" fullWidth onClick={onCancel}>
                            {t('lowBalance.cancel')}
                        </Button>
                        <Button variant="fill" size="l" fullWidth onClick={onChange}>
                            {t('lowBalance.change')}
                        </Button>
                    </>
                ) : (
                    <Button variant="fill" size="l" fullWidth onClick={onCancel}>
                        {t('lowBalance.close')}
                    </Button>
                )}
            </div>
        </Modal>
    );
};
