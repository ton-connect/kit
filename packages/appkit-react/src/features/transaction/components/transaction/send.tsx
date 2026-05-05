/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useMemo } from 'react';
import type { FC, ReactNode, ComponentProps } from 'react';
import type { SendTransactionParameters, SendTransactionReturnType } from '@ton/appkit';

import { SendProvider, useSendContext } from '../transaction-provider';
import { useI18n } from '../../../../hooks/use-i18n';
import { Button } from '../../../../components/button';

export interface SendRenderProps {
    isLoading: boolean;
    onSubmit: () => void;
    disabled: boolean;
    text: ReactNode;
}

export type SendRequest =
    | SendTransactionParameters
    | Promise<SendTransactionParameters>
    | (() => SendTransactionParameters)
    | (() => Promise<SendTransactionParameters>);

export interface SendProps extends Omit<ComponentProps<'button'>, 'children' | 'onError'> {
    /** The transaction request parameters */
    request: SendRequest;
    /** Callback when an error occurs */
    onError?: (error: Error) => void;
    /** Callback when the transaction is successful */
    onSuccess?: (response: SendTransactionReturnType) => void;
    /** Custom button text */
    text?: ReactNode;
    /** Custom render function */
    children?: (props: SendRenderProps) => ReactNode;
}

interface SendContentProps extends Omit<ComponentProps<'button'>, 'children'> {
    text?: ReactNode;
    children?: (props: SendRenderProps) => ReactNode;
}

const SendContent: FC<SendContentProps> = ({ text, children, ...props }) => {
    const { isLoading, onSubmit, disabled } = useSendContext();
    const { t } = useI18n();

    const isDisabled = disabled || isLoading;

    const handleSubmit = useCallback(() => {
        if (!isDisabled) {
            onSubmit();
        }
    }, [isDisabled, onSubmit]);

    const buttonText = useMemo(() => {
        if (isLoading) {
            return t('transaction.processing');
        }

        return text ?? t('transaction.sendTransaction');
    }, [isLoading, text, t]);

    if (children) {
        return (
            <>
                {children({
                    isLoading,
                    onSubmit: handleSubmit,
                    disabled: isDisabled,
                    text: buttonText,
                })}
            </>
        );
    }

    return (
        <Button onClick={handleSubmit} disabled={isDisabled} {...props}>
            {buttonText}
        </Button>
    );
};

export const Send: FC<SendProps> = ({
    request,
    children,
    className,
    onError,
    onSuccess,
    disabled = false,
    text,
    ...props
}) => {
    return (
        <SendProvider request={request} onError={onError} onSuccess={onSuccess} disabled={disabled}>
            <SendContent className={className} text={text} {...props}>
                {children}
            </SendContent>
        </SendProvider>
    );
};
