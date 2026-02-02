/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useMemo } from 'react';
import type { FC, ReactNode, ComponentProps } from 'react';

import { useTransactionContext } from '../transaction-provider';
import { Button } from '../../../../components/button';
import { useI18n } from '../../../../hooks/use-i18n';

export interface TransactionButtonProps extends ComponentProps<'button'> {
    text?: ReactNode;
    render?: (params: { isLoading: boolean; onSubmit: () => void; disabled: boolean }) => ReactNode;
}

export const TransactionButton: FC<TransactionButtonProps> = ({ text = 'Confirm', render }) => {
    const { isLoading, onSubmit, receipt, error, disabled } = useTransactionContext();
    const { t } = useI18n();

    const isDisabled = disabled || isLoading;

    const handleSubmit = useCallback(() => {
        if (!isDisabled) {
            onSubmit();
        }
    }, [isDisabled, onSubmit]);

    const buttonContent = useMemo(() => {
        if (isLoading) {
            return t('transaction.processing');
        }
        if (error) {
            return t('transaction.tryAgain');
        }
        if (receipt) {
            return t('transaction.success');
        }
        return text ?? t('transaction.confirm');
    }, [isLoading, receipt, error, text, t]);

    if (render) {
        return (
            <>
                {render({
                    isLoading,
                    onSubmit: handleSubmit,
                    disabled: isDisabled,
                })}
            </>
        );
    }

    return (
        <Button onClick={handleSubmit} disabled={isDisabled}>
            {buttonContent}
        </Button>
    );
};
