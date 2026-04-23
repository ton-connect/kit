/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { ComponentProps, FC } from 'react';
import { Button, useSelectedWallet, useSignText } from '@ton/appkit-react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/core/lib/utils';

export const SignMessageCard: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
    const [message, setMessage] = useState('');
    const [signature, setSignature] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const [wallet] = useSelectedWallet();
    const isConnected = !!wallet;

    const { mutate: signText, isPending } = useSignText({
        mutation: {
            onSuccess: (result) => {
                setSignature(result.signature);
                toast.success('Message signed successfully!');
            },
            onError: (error) => {
                toast.error(`Signing failed: ${error.message}`);
            },
        },
    });

    const handleSign = () => {
        if (!isConnected || !message.trim()) return;
        signText({ text: message });
    };

    const handleCopySignature = async () => {
        if (!signature) return;
        await navigator.clipboard.writeText(signature);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const canSign = isConnected && message.trim().length > 0 && !isPending;

    return (
        <div className={cn('mx-auto flex w-full max-w-[434px] flex-col gap-4', className)} {...props}>
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Sign Message</h2>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl bg-secondary p-4">
                <label htmlFor="sign-message-input" className="text-xs font-medium text-tertiary-foreground">
                    Message
                </label>
                <textarea
                    id="sign-message-input"
                    className="min-h-28 w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-tertiary-foreground"
                    placeholder="Enter your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isPending}
                />
            </div>

            <Button size="l" variant="fill" fullWidth onClick={handleSign} disabled={!canSign} loading={isPending}>
                {isConnected ? 'Sign Message' : 'Connect wallet to sign'}
            </Button>

            {signature && (
                <div className="flex flex-col gap-2 rounded-2xl bg-secondary p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-tertiary-foreground">Signature</span>
                        <button
                            type="button"
                            onClick={handleCopySignature}
                            aria-label="Copy signature"
                            className="flex size-6 items-center justify-center rounded text-tertiary-foreground transition-colors hover:text-foreground"
                        >
                            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                        </button>
                    </div>
                    <code className="break-all font-mono text-xs text-foreground">{signature}</code>
                </div>
            )}
        </div>
    );
};
