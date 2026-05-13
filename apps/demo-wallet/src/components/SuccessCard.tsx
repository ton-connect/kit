/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';

interface SuccessCardProps {
    message: string;
}

export const SuccessCard: React.FC<SuccessCardProps> = ({ message }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <style>{`
            @keyframes scale-in {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            .success-card { animation: scale-in 0.3s ease-out; }
        `}</style>
        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg max-w-md w-full p-8 relative overflow-hidden success-card">
            <div className="relative z-10 text-center text-white space-y-6">
                <div className="flex justify-center">
                    <div className="bg-white rounded-full p-4">
                        <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-bold mb-2">Success!</h2>
                    <p className="text-green-50 text-lg">{message}</p>
                </div>
            </div>
        </div>
    </div>
);
