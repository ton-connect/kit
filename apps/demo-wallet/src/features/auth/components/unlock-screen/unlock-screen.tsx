/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useWallet } from '@demo/wallet-core';

import { CenteredScreen } from '@/core/components/shared/centered-screen';
import { ConfirmModal } from '@/core/components/shared/confirm-modal';
import { Button } from '@/core/components/ui/button';

const INPUT_CLASS =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

export const UnlockScreen: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResetOpen, setIsResetOpen] = useState(false);

    const navigate = useNavigate();
    const { unlock, reset } = useAuth();
    const { loadAllWallets } = useWallet();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = async () => {
        if (!password || isLoading) return;
        setError('');
        setIsLoading(true);
        try {
            const success = await unlock(password);
            if (!success) {
                throw new Error('Incorrect password');
            }
            await loadAllWallets();
            navigate('/wallet');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to unlock wallet');
        } finally {
            setIsLoading(false);
        }
    };

    // Fired by the on-screen keyboard's Return/Go key (and the hidden submit button).
    // Mirrors the Unlock button; the guard in handleSubmit makes it a no-op when empty.
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void handleSubmit();
    };

    const handleReset = () => {
        setIsResetOpen(false);
        reset();
        navigate('/welcome');
    };

    const footer = (
        <div className="space-y-3">
            <Button
                data-testid="password-submit"
                fullWidth
                loading={isLoading}
                onClick={handleSubmit}
                disabled={!password || isLoading}
            >
                Unlock
            </Button>
            <Button variant="ghost" size="sm" fullWidth onClick={() => setIsResetOpen(true)}>
                Reset Wallet
            </Button>
        </div>
    );

    return (
        <CenteredScreen footer={footer}>
            <div className="flex flex-col items-center text-center px-6">
                <h1 className="text-2xl font-bold text-gray-900" data-testid="subtitle">
                    Enter your password
                </h1>
                <p className="mt-2 text-base text-gray-500">Enter your password to unlock your wallet.</p>

                <form onSubmit={handleFormSubmit} className="mt-8 w-full text-left">
                    <input
                        ref={inputRef}
                        type="password"
                        data-testid="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                        }}
                        placeholder="Password"
                        autoComplete="current-password"
                        enterKeyHint="go"
                        aria-label="Password"
                        className={INPUT_CLASS}
                    />
                    {/* Return submits the form (unlock). A submit button inside the form is
                        what makes iOS Safari's Return act; it is visually hidden — the visible
                        action is the Unlock button below. */}
                    <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
                </form>

                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            </div>

            <ConfirmModal
                isOpen={isResetOpen}
                title="Reset wallet"
                description="This will permanently delete all wallet data on this device. Make sure you have your recovery phrase."
                confirmLabel="Reset"
                cancelLabel="Cancel"
                danger
                onConfirm={handleReset}
                onClose={() => setIsResetOpen(false)}
            />
        </CenteredScreen>
    );
};
