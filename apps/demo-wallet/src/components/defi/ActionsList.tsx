import React from 'react';

import { Button, Card } from '../';
import type { Action, DeFiEndpoint } from '../../types';

interface ActionsListProps {
    endpoint: DeFiEndpoint;
    actions: Action[];
    onActionSelect: (action: Action) => void;
    onBack: () => void;
}

export const ActionsList: React.FC<ActionsListProps> = ({ endpoint, actions, onActionSelect, onBack }) => {
    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'swap':
            case 'exchange':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                    </svg>
                );
            case 'pool':
            case 'liquidity':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                    </svg>
                );
            case 'stake':
            case 'staking':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
            case 'lend':
            case 'borrow':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'swap':
            case 'exchange':
                return 'text-blue-600 bg-blue-100';
            case 'pool':
            case 'liquidity':
                return 'text-green-600 bg-green-100';
            case 'stake':
            case 'staking':
                return 'text-purple-600 bg-purple-100';
            case 'lend':
            case 'borrow':
                return 'text-orange-600 bg-orange-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <Card
            title={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={onBack}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Back to endpoints"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">Available Actions</h2>
                            <p className="text-sm text-gray-500">{endpoint.name}</p>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="space-y-3">
                {actions.length === 0 ? (
                    <div className="text-center py-8">
                        <svg
                            className="w-12 h-12 text-gray-400 mx-auto mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                        </svg>
                        <p className="text-gray-500">No actions available</p>
                    </div>
                ) : (
                    actions.map((action) => (
                        <div
                            key={action.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div
                                            className={`inline-flex items-center p-2 rounded-md ${getCategoryColor(action.category)}`}
                                        >
                                            {getCategoryIcon(action.category)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{action.title}</h3>
                                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                <span className="capitalize">{action.category}</span>
                                                <span>•</span>
                                                <span>v{action.version}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-600 font-mono mb-2">ID: {action.id}</p>

                                    {action.contracts.length > 0 && (
                                        <div className="text-xs text-gray-500">
                                            <p>
                                                <span className="font-medium">Contracts:</span>{' '}
                                                {action.contracts.length} contract
                                                {action.contracts.length !== 1 ? 's' : ''}
                                            </p>
                                            <div className="mt-1 space-y-1">
                                                {action.contracts.slice(0, 2).map((contract, index) => (
                                                    <div key={index} className="flex items-center space-x-2">
                                                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                                                            {contract.role}
                                                        </span>
                                                        <span className="font-mono text-xs">
                                                            {contract.address.slice(0, 16)}...
                                                        </span>
                                                    </div>
                                                ))}
                                                {action.contracts.length > 2 && (
                                                    <p className="text-xs text-gray-400">
                                                        +{action.contracts.length - 2} more
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="ml-4">
                                    <Button onClick={() => onActionSelect(action)} size="sm">
                                        Use Action
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
};
