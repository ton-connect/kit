/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { FC, ComponentProps } from 'react';
import { useSignText, useSelectedWallet } from '@ton/appkit-ui-react';
import { toast } from 'sonner';

import { Card, Button } from '@/core/components';

export const SignMessageCard: FC<ComponentProps<'div'>> = (props) => {
    const [message, setMessage] = useState('');
    const [signature, setSignature] = useState<string | null>(null);

    const [wallet] = useSelectedWallet();
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
        if (!wallet || !message.trim()) {
            toast.error('Please enter a message to sign');
            return;
        }

        signText({ text: message });
    };

    const handleCopySignature = () => {
        if (signature) {
            navigator.clipboard.writeText(signature);
            toast.success('Signature copied to clipboard!');
        }
    };

    return (
        <Card title="Sign Message" {...props}>
            <div className="space-y-4">
                {/* Message Input */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Message to sign</label>
                    <textarea
                        className="w-full p-3 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={3}
                        placeholder="Enter your message here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isPending}
                    />
                </div>

                {/* Sign Button */}
                <Button
                    className="w-full"
                    variant="primary"
                    onClick={handleSign}
                    disabled={!wallet || !message.trim() || isPending}
                >
                    {isPending ? 'Signing...' : 'Sign Message'}
                </Button>

                {/* Signature Result */}
                {signature && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">Signature</label>
                        <div className="p-3 bg-muted border border-border rounded-lg">
                            <code className="text-xs text-foreground break-all">{signature}</code>
                        </div>
                        <Button className="w-full" variant="secondary" size="sm" onClick={handleCopySignature}>
                            Copy Signature
                        </Button>
                    </div>
                )}

                {/* Info */}
                {!wallet && (
                    <p className="text-sm text-muted-foreground text-center">Connect wallet to sign messages</p>
                )}
            </div>
        </Card>
    );
};
