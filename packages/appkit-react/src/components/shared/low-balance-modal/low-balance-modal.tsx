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

/**
 * Behavior mode for {@link LowBalanceModal} — see {@link LowBalanceModalProps.mode}.
 *
 * @public
 * @category Type
 * @section Shared
 */
export type LowBalanceMode = 'reduce' | 'topup';

/**
 * Props accepted by {@link LowBalanceModal}.
 *
 * @public
 * @category Type
 * @section Shared
 */
export interface LowBalanceModalProps {
    /** Controls visibility of the modal. */
    open: boolean;
    /**
     * `reduce` — user can fix it by reducing the amount (shows Change/Cancel).
     * `topup`  — reducing doesn't help, user must top up TON (shows Close only).
     */
    mode: LowBalanceMode;
    /** Required amount in TON, formatted as a decimal string (e.g. `"0.423"`). */
    requiredTon: string;
    /** Called when the user clicks the primary "Change" action (only in `reduce` mode). */
    onChange: () => void;
    /** Called when the user dismisses the modal (Cancel, Close, or backdrop click). */
    onCancel: () => void;
}

/**
 * Modal shown when a transaction would leave insufficient TON to cover fees — adapts its body and buttons to the {@link LowBalanceMode}.
 *
 * @sample docs/examples/src/appkit/components/shared#LOW_BALANCE_MODAL
 *
 * @public
 * @category Component
 * @section Shared
 */
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
