/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useMemo } from 'react';
import type { FC, ReactNode } from 'react';
import type { SendTransactionParameters, SendTransactionReturnType } from '@ton/appkit';

import { useI18n } from '../../../settings/hooks/use-i18n';
import { SendProvider, useSendContext } from '../transaction-provider';
import { Button } from '../../../../components/ui/button';
import type { ButtonProps } from '../../../../components/ui/button';

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

export interface SendProps extends Omit<ButtonProps, 'children' | 'onError'> {
    /** Transaction request (or a sync/async producer of one) the button hands to {@link sendTransaction} on click. */
    request: SendRequest;
    /** Called when the wallet rejects the request or the send fails. Receives the raised `Error`. */
    onError?: (error: Error) => void;
    /** Called once the transaction is broadcast. Receives the wallet's {@link SendTransactionReturnType} (BoC + normalized hash). */
    onSuccess?: (response: SendTransactionReturnType) => void;
    /** Override the button label. Defaults to "Send". */
    text?: ReactNode;
    /** Custom render function — replaces the default button with the caller's UI. Receives the current send state and click handler via {@link SendRenderProps}. */
    children?: (props: SendRenderProps) => ReactNode;
}

interface SendContentProps extends Omit<ButtonProps, 'children'> {
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
