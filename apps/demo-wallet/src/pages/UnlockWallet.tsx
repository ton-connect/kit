import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth, useWallet } from '../stores';
import { Layout, Button, Input, Card } from '../components';

export const UnlockWallet: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { unlock, reset } = useAuth();
    const { loadWallet } = useWallet();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const success = await unlock(password);
            if (!success) {
                throw new Error('Invalid password');
            }

            // Load wallet data after successful unlock
            await loadWallet();

            // Navigate to wallet
            navigate('/wallet');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to unlock wallet');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        if (
            window.confirm('Are you sure you want to reset your wallet? This will delete all wallet data permanently.')
        ) {
            reset();
            navigate('/setup-password');
        }
    };

    return (
        <Layout title="Unlock Wallet">
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900" data-test-id="subtitle">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">Enter your password to unlock your wallet.</p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            type="password"
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            autoFocus
                        />

                        {error && <div className="text-red-600 text-sm text-center">{error}</div>}

                        <Button type="submit" isLoading={isLoading} disabled={!password} className="w-full">
                            Unlock Wallet
                        </Button>
                    </form>
                </Card>

                <div className="text-center flex flex-col items-center">
                    <Button variant="secondary" onClick={handleReset} className="text-sm">
                        Reset Wallet
                    </Button>
                    <p className="mt-2 text-xs text-gray-500">This will permanently delete your wallet data</p>
                </div>
            </div>
        </Layout>
    );
};
