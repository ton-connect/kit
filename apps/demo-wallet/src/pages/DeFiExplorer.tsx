import React, { useState, useCallback, useEffect } from 'react';
// import { useWalletKit } from '@ton/walletkit';

import { Layout, TransactionRequestModal } from '../components';
import { EndpointsList, ActionsList, SwapInterface } from '../components/defi';
import type { DeFiEndpoint, Action, ApiMeta, SwapQuote } from '../types';
import { createComponentLogger } from '../utils/logger';
import { useTransactionRequests, useWallet, useWalletKit } from '../stores';

const log = createComponentLogger('DeFiExplorer');

type ViewState = 'endpoints' | 'actions' | 'swap';

interface DeFiExplorerState {
    view: ViewState;
    selectedEndpoint: DeFiEndpoint | null;
    selectedAction: Action | null;
}

export const DeFiExplorer: React.FC = () => {
    const { address, savedWallets } = useWallet();

    const { pendingTransactionRequest, isTransactionModalOpen, approveTransactionRequest, rejectTransactionRequest } =
        useTransactionRequests();

    const [state, setState] = useState<DeFiExplorerState>({
        view: 'endpoints',
        selectedEndpoint: null,
        selectedAction: null,
    });

    const [endpoints, setEndpoints] = useState<DeFiEndpoint[]>([
        {
            name: 'Local DeFi API',
            url: 'http://localhost:4000',
            status: 'disconnected',
        },
        {
            name: 'Demo DeFi API',
            url: 'https://demo-defi-api.ton.org', // Example endpoint
            status: 'disconnected',
        },
    ]);

    // Fetch metadata and actions from endpoint
    const connectToEndpoint = useCallback(async (endpoint: DeFiEndpoint) => {
        log.info('Connecting to endpoint:', endpoint.url);

        // Update endpoint status to loading
        setEndpoints((prev) => prev.map((ep) => (ep.url === endpoint.url ? { ...ep, status: 'loading' } : ep)));

        try {
            // Fetch metadata
            const metaResponse = await fetch(`${endpoint.url}/api/ton/meta`);
            if (!metaResponse.ok) {
                throw new Error(`Failed to fetch metadata: ${metaResponse.status} ${metaResponse.statusText}`);
            }
            const meta: ApiMeta = await metaResponse.json();

            // Fetch actions
            const actionsResponse = await fetch(`${endpoint.url}/api/ton/actions`);
            if (!actionsResponse.ok) {
                throw new Error(`Failed to fetch actions: ${actionsResponse.status} ${actionsResponse.statusText}`);
            }
            const actionsData = await actionsResponse.json();
            const actions: Action[] = actionsData.actions || [];

            // Update endpoint with fetched data
            setEndpoints((prev) =>
                prev.map((ep) => (ep.url === endpoint.url ? { ...ep, status: 'connected', meta, actions } : ep)),
            );

            log.info('Successfully connected to endpoint:', {
                url: endpoint.url,
                meta,
                actionsCount: actions.length,
            });
        } catch (error) {
            log.error('Failed to connect to endpoint:', error);

            // Update endpoint status to disconnected
            setEndpoints((prev) =>
                prev.map((ep) => (ep.url === endpoint.url ? { ...ep, status: 'disconnected' } : ep)),
            );

            // Re-throw to let the UI handle the error display
            throw error;
        }
    }, []);

    const handleEndpointSelect = useCallback((endpoint: DeFiEndpoint) => {
        setState({
            view: 'actions',
            selectedEndpoint: endpoint,
            selectedAction: null,
        });
    }, []);

    const handleActionSelect = useCallback((action: Action) => {
        setState((prev) => ({
            ...prev,
            view: 'swap',
            selectedAction: action,
        }));
    }, []);

    const handleBackToEndpoints = useCallback(() => {
        setState({
            view: 'endpoints',
            selectedEndpoint: null,
            selectedAction: null,
        });
    }, []);

    const handleBackToActions = useCallback(() => {
        setState((prev) => ({
            ...prev,
            view: 'actions',
            selectedAction: null,
        }));
    }, []);

    const walletKit = useWalletKit();

    const handleSwapExecute = useCallback(
        async (swapQuote: SwapQuote) => {
            log.info('Executing swap transaction:', swapQuote);

            try {
                // In a real implementation, this would:
                // 1. Use TON Connect to send the transaction
                // 2. Wait for confirmation
                // 3. Show success/error messages

                // eslint-disable-next-line no-console
                console.log('swapQuote', swapQuote);
                // For now, we'll just log the transaction data
                log.info('Transaction to execute:', {
                    messages: swapQuote.ton_connect.messages,
                    validUntil: swapQuote.ton_connect.valid_until,
                    gaslessUsed: swapQuote.gasless_used,
                });

                const wallet = await walletKit?.getWallets()[0];
                if (!wallet) {
                    throw new Error('No wallet found');
                }
                // console.lo;
                const tx = await wallet?.createTransferMultiTonTransaction({
                    messages: swapQuote.ton_connect.messages.map((m) => {
                        return {
                            toAddress: m.address,
                            amount: m.amount,
                            stateInit: m.state_init ?? undefined,
                            body: m.payload,
                        };
                    }),
                });
                walletKit?.handleNewTransaction(wallet, tx);
                // const tx = aw

                // Show an alert with transaction details (for demo purposes)
                // const messagesText = buildResponse.ton_connect.messages
                //     .map((msg, i) => `Message ${i + 1}: ${msg.address} - ${msg.amount} nanoTON`)
                //     .join('\n');

                // alert(
                //     `Transaction ready to execute:\n\n${messagesText}\n\nIn a real wallet, this would be sent via TON Connect.`,
                // );
            } catch (error) {
                log.error('Failed to execute swap:', error);
                // alert(`Failed to execute swap: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        [walletKit],
    );

    // Auto-connect to localhost endpoint if it exists and user has a wallet
    useEffect(() => {
        const localhostEndpoint = endpoints.find((ep) => ep.url.includes('localhost'));
        if (localhostEndpoint && localhostEndpoint.status === 'disconnected' && address) {
            // Auto-connect to localhost for development
            connectToEndpoint(localhostEndpoint).catch((error) => {
                log.warn('Auto-connect to localhost failed:', error);
                // Fail silently for auto-connect
            });
        }
    }, [address, endpoints, connectToEndpoint]);

    // Render current view
    const renderCurrentView = () => {
        switch (state.view) {
            case 'actions':
                if (!state.selectedEndpoint) return null;
                return (
                    <ActionsList
                        endpoint={state.selectedEndpoint}
                        actions={state.selectedEndpoint.actions || []}
                        onActionSelect={handleActionSelect}
                        onBack={handleBackToEndpoints}
                    />
                );

            case 'swap':
                if (!state.selectedEndpoint || !state.selectedAction) return null;
                return (
                    <SwapInterface
                        endpoint={state.selectedEndpoint}
                        action={state.selectedAction}
                        onBack={handleBackToActions}
                        onSwapExecute={handleSwapExecute}
                    />
                );

            case 'endpoints':
            default:
                return (
                    <EndpointsList
                        endpoints={endpoints}
                        onEndpointConnect={connectToEndpoint}
                        onEndpointSelect={handleEndpointSelect}
                    />
                );
        }
    };

    return (
        <Layout title="DeFi Explorer" showLogout>
            <div className="space-y-6">
                {/* Header Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">DeFi Protocol Explorer</h3>
                            <p className="mt-1 text-sm text-blue-700">
                                Explore and interact with DeFi protocols that implement the Universal TON DeFi API
                                (UTD-API) specification.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Wallet Status Warning */}
                {!address && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-800">
                                    <strong>Wallet Required:</strong> You need an active wallet to interact with DeFi
                                    protocols. Some features may be limited without a connected wallet address.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Current View */}
                {renderCurrentView()}

                {/* Debug Info (Development Only) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-xs">
                        <h4 className="font-medium text-gray-700 mb-2">Debug Info</h4>
                        <div className="space-y-1 font-mono text-gray-600">
                            <p>Current View: {state.view}</p>
                            <p>Selected Endpoint: {state.selectedEndpoint?.name || 'None'}</p>
                            <p>Selected Action: {state.selectedAction?.title || 'None'}</p>
                            <p>Wallet Address: {address || 'None'}</p>
                            <p>Connected Endpoints: {endpoints.filter((ep) => ep.status === 'connected').length}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction Request Modal */}
            {pendingTransactionRequest && (
                <TransactionRequestModal
                    request={pendingTransactionRequest}
                    savedWallets={savedWallets}
                    isOpen={isTransactionModalOpen}
                    onApprove={approveTransactionRequest}
                    onReject={rejectTransactionRequest}
                />
            )}
        </Layout>
    );
};
