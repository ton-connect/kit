/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@demo/wallet-core';

import { CenteredScreen } from '@/core/components/shared/centered-screen';
import { Button } from '@/core/components/ui/button';
import { WALLET_SETUP_ROUTE } from '@/features/wallet-setup';
import type { WalletSetupMode } from '@/features/wallet-setup';

const MIN_LENGTH = 4;

const INPUT_CLASS =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

export const SetupPasswordScreen: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { setPassword: setStorePassword } = useAuth();
    const inputRef = useRef<HTMLInputElement>(null);
    const confirmRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const tooShort = password.length > 0 && password.length < MIN_LENGTH;
    const mismatch = confirmPassword.length > 0 && confirmPassword !== password;
    const canSubmit = password.length >= MIN_LENGTH && password === confirmPassword && !isLoading;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setError('');
        setIsLoading(true);
        try {
            await setStorePassword(password);
            // Route by the chosen path — each has its own dedicated screen.
            const tab = (location.state as { tab?: WalletSetupMode } | null)?.tab;
            navigate(WALLET_SETUP_ROUTE[tab ?? 'create']);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Fired by the on-screen keyboard's Return/Go key (and the hidden submit button).
    // Mirrors the Continue button; the canSubmit guard makes it a no-op when invalid.
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void handleSubmit();
    };

    const footer = (
        <Button
            data-testid="password-submit"
            fullWidth
            loading={isLoading}
            onClick={handleSubmit}
            disabled={!canSubmit}
        >
            Continue
        </Button>
    );

    return (
        <CenteredScreen onBack={() => navigate(-1)} footer={footer}>
            <div className="flex flex-col items-center text-center px-6">
                <h1 className="text-2xl font-bold text-gray-900" data-testid="subtitle">
                    Create a password
                </h1>
                <p className="mt-2 text-base text-gray-500">Create a password to protect your wallet.</p>

                <form onSubmit={handleFormSubmit} className="mt-8 w-full space-y-3 text-left">
                    <input
                        ref={inputRef}
                        type="password"
                        data-testid="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                        }}
                        onKeyDown={(e) => {
                            // Return on Password moves focus to Confirm (matches Android "Next").
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                confirmRef.current?.focus();
                            }
                        }}
                        placeholder="Password"
                        autoComplete="new-password"
                        enterKeyHint="next"
                        aria-label="Password"
                        className={INPUT_CLASS}
                    />
                    <input
                        ref={confirmRef}
                        type="password"
                        data-testid="password-confirm"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setError('');
                        }}
                        placeholder="Confirm password"
                        autoComplete="new-password"
                        enterKeyHint="go"
                        aria-label="Confirm password"
                        className={INPUT_CLASS}
                    />
                    {/* Return on Confirm submits the form (matches Android "Go"). A submit
                        button inside the form is what makes iOS Safari's Return act. It is
                        visually hidden — the visible action is the Continue button below. */}
                    <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
                </form>

                {(error || tooShort || mismatch) && (
                    <p className="mt-4 text-sm text-red-500">
                        {error ||
                            (tooShort
                                ? `Password must be at least ${MIN_LENGTH} characters`
                                : 'Passwords do not match')}
                    </p>
                )}

                <p className="mt-6 text-xs text-gray-400">
                    Make sure to remember your password — it can’t be recovered if forgotten.
                </p>
            </div>
        </CenteredScreen>
    );
};
