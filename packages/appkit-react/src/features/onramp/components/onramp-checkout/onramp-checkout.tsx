/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { Modal } from '../../../../components/modal';
import { Button } from '../../../../components/button';
import type { AppkitUIToken } from '../../../../types/appkit-ui-token';
import type { OnrampProvider } from '../../types';
import styles from './onramp-checkout.module.css';

export interface OnrampCheckoutProps {
    open: boolean;
    onClose: () => void;
    token: AppkitUIToken | null;
    amount: string;
    fiatAmount: string;
    fiatSymbol: string;
    provider: OnrampProvider | null;
    isPurchasing: boolean;
    onConfirm: () => void;
}

export const OnrampCheckout: FC<OnrampCheckoutProps> = ({
    open,
    onClose,
    token,
    amount,
    fiatAmount,
    fiatSymbol,
    provider,
    isPurchasing,
    onConfirm,
}) => {
    return (
        <Modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()} title="Checkout">
            <div className={styles.content}>
                <div className={styles.amountSection}>
                    <span className={styles.tokenAmount}>
                        {amount} {token?.symbol}
                    </span>
                    <span className={styles.fiatAmount}>
                        {fiatSymbol} {fiatAmount}
                    </span>
                </div>

                {provider && (
                    <div className={styles.providerRow}>
                        <span className={styles.providerLabel}>Provider</span>
                        <span className={styles.providerName}>{provider.name}</span>
                    </div>
                )}

                <Button variant="fill" size="l" fullWidth disabled={isPurchasing} onClick={onConfirm}>
                    {isPurchasing ? 'Processing...' : 'Continue'}
                </Button>
            </div>
        </Modal>
    );
};
