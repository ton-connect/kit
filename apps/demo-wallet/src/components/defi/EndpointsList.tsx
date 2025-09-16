import React, { useState, useCallback } from 'react';

import { Button, Card } from '../';
import type { DeFiEndpoint } from '../../types';
import { createComponentLogger } from '../../utils/logger';

const log = createComponentLogger('EndpointsList');

interface EndpointsListProps {
    endpoints: DeFiEndpoint[];
    onEndpointConnect: (endpoint: DeFiEndpoint) => Promise<void>;
    onEndpointSelect: (endpoint: DeFiEndpoint) => void;
}

export const EndpointsList: React.FC<EndpointsListProps> = ({ endpoints, onEndpointConnect, onEndpointSelect }) => {
    const [loadingEndpoint, setLoadingEndpoint] = useState<string | null>(null);

    const handleConnect = useCallback(
        async (endpoint: DeFiEndpoint) => {
            if (endpoint.status === 'connected') {
                onEndpointSelect(endpoint);
                return;
            }

            setLoadingEndpoint(endpoint.url);
            try {
                await onEndpointConnect(endpoint);
                onEndpointSelect(endpoint);
            } catch (error) {
                log.error('Failed to connect to endpoint:', error);
            } finally {
                setLoadingEndpoint(null);
            }
        },
        [onEndpointConnect, onEndpointSelect],
    );

    const getStatusColor = (status: DeFiEndpoint['status']) => {
        switch (status) {
            case 'connected':
                return 'text-green-600 bg-green-100';
            case 'loading':
                return 'text-yellow-600 bg-yellow-100';
            case 'disconnected':
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusText = (status: DeFiEndpoint['status']) => {
        switch (status) {
            case 'connected':
                return 'Connected';
            case 'loading':
                return 'Connecting...';
            case 'disconnected':
            default:
                return 'Disconnected';
        }
    };

    return (
        <Card title="DeFi Endpoints">
            <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">Select a DeFi endpoint to explore available operations.</p>

                {endpoints.length === 0 ? (
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
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                        </svg>
                        <p className="text-gray-500">No endpoints configured</p>
                    </div>
                ) : (
                    endpoints.map((endpoint) => (
                        <div
                            key={endpoint.url}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-lg font-medium text-gray-900">{endpoint.name}</h3>
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(endpoint.status)}`}
                                        >
                                            {getStatusText(endpoint.status)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 font-mono mb-2">{endpoint.url}</p>

                                    {endpoint.meta && (
                                        <div className="text-xs text-gray-500 space-y-1">
                                            <p>
                                                <span className="font-medium">Spec:</span> {endpoint.meta.spec} v
                                                {endpoint.meta.version}
                                            </p>
                                            <p>
                                                <span className="font-medium">Chain ID:</span> {endpoint.meta.chain_id}
                                            </p>
                                            {endpoint.actions && (
                                                <p>
                                                    <span className="font-medium">Actions:</span>{' '}
                                                    {endpoint.actions.length} available
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="ml-4">
                                    <Button
                                        variant={endpoint.status === 'connected' ? 'primary' : 'secondary'}
                                        onClick={() => handleConnect(endpoint)}
                                        isLoading={loadingEndpoint === endpoint.url}
                                        disabled={endpoint.status === 'loading'}
                                        size="sm"
                                    >
                                        {endpoint.status === 'connected' ? 'Explore' : 'Connect'}
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
