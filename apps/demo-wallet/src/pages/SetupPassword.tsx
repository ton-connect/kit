/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@demo/wallet-core';

import { Layout, Button, Input, Card } from '../components';

export const SetupPassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { setPassword: setStorePassword } = useAuth();

    const validatePassword = (pwd: string): string[] => {
        const errors = [];
        if (pwd.length < 4) errors.push('Password must be at least 4 characters long');
        // if (!/[A-Z]/.test(pwd)) errors.push('Password must contain at least one uppercase letter');
        // if (!/[a-z]/.test(pwd)) errors.push('Password must contain at least one lowercase letter');
        // if (!/[0-9]/.test(pwd)) errors.push('Password must contain at least one number');
        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Validate password
            const validationErrors = validatePassword(password);
            if (validationErrors.length > 0) {
                throw new Error(validationErrors[0]);
            }

            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            // Set password in store
            await setStorePassword(password);

            // Navigate to mnemonic setup
            navigate('/setup-wallet');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout title="Setup Password">
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900" data-testid="subtitle">
                        Create Password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Your password will be used to encrypt your wallet data locally.
                    </p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            data-testid="password"
                            type="password"
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter a strong password"
                            required
                            helperText="At least 8 characters with uppercase, lowercase, and numbers"
                        />

                        <Input
                            data-testid="password-confirm"
                            type="password"
                            label="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                        />

                        {error && <div className="text-red-600 text-sm text-center">{error}</div>}

                        <Button
                            data-testid="password-submit"
                            type="submit"
                            isLoading={isLoading}
                            disabled={!password || !confirmPassword}
                            className="w-full"
                        >
                            Continue
                        </Button>
                    </form>
                </Card>

                <div className="text-center text-sm text-gray-500">
                    <p>⚠️ Make sure to remember your password.</p>
                    <p>It cannot be recovered if forgotten.</p>
                </div>
            </div>
        </Layout>
    );
};
