/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { Modal } from '../../../../../components/ui/modal';
import { useI18n } from '../../../../settings/hooks/use-i18n';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import styles from './crypto-onramp-refund-address-modal.module.css';

export interface CryptoOnrampRefundAddressModalProps {
    open: boolean;
    onClose: () => void;
    value: string;
    onChange: (value: string) => void;
    onConfirm: () => void;
    isLoading: boolean;
    error?: string | null;
}

export const CryptoOnrampRefundAddressModal: FC<CryptoOnrampRefundAddressModalProps> = ({
    open,
    onClose,
    value,
    onChange,
    onConfirm,
    error,
    isLoading,
}) => {
    const { t } = useI18n();

    return (
        <Modal
            open={open}
            onOpenChange={(isOpen) => !isOpen && onClose()}
            title={t('cryptoOnramp.refundAddressModalTitle')}
        >
            <div className={styles.content}>
                <p className={styles.label}>{t('cryptoOnramp.refundAddressLabel')}</p>

                <Input.Container size="s" error={!!error}>
                    <Input.Field>
                        <Input.Input
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={t('cryptoOnramp.refundAddressPlaceholder')}
                            autoFocus
                        />
                    </Input.Field>
                    {error && <Input.Caption>{error}</Input.Caption>}
                </Input.Container>

                <Button variant="fill" size="l" fullWidth onClick={onConfirm} disabled={!value.trim() || isLoading}>
                    {t('cryptoOnramp.continue')}
                </Button>
            </div>
        </Modal>
    );
};
