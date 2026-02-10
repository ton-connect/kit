/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import type { Connector } from '@ton/appkit';

import { ConnectorsList } from './connectors-list';

// Mock the hooks for Storybook
const mockConnectors: Connector[] = [
    {
        id: 'tonkeeper',
        metadata: {
            name: 'Tonkeeper',
            iconUrl: 'https://tonkeeper.com/assets/tonkeeper-logo.png',
        },
    } as Connector,
    {
        id: 'openmask',
        metadata: {
            name: 'OpenMask',
            iconUrl: 'https://openmask.app/openmask-logo.png',
        },
    } as Connector,
    {
        id: 'mytonwallet',
        metadata: {
            name: 'MyTonWallet',
            iconUrl: '',
        },
    } as Connector,
];

// Create a wrapper component that doesn't use the hooks
const ConnectorsListPreview = ({
    connectors,
    onConnectorSelect,
}: {
    connectors: typeof mockConnectors;
    onConnectorSelect?: (connectorId: string) => void;
}) => {
    if (connectors.length === 0) {
        return <div style={{ padding: '16px', color: '#8e8e93', textAlign: 'center' }}>No wallets found</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {connectors.map((connector) => (
                <div
                    key={connector.id}
                    onClick={() => onConnectorSelect?.(connector.id)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: '#1c1c1e',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: 'white',
                    }}
                >
                    {connector.metadata.iconUrl ? (
                        <img
                            src={connector.metadata.iconUrl}
                            alt={connector.metadata.name}
                            style={{ width: '40px', height: '40px', borderRadius: '8px' }}
                        />
                    ) : (
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                background: '#0098EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {connector.metadata.name[0]}
                        </div>
                    )}
                    <span>{connector.metadata.name}</span>
                </div>
            ))}
        </div>
    );
};

const meta: Meta<typeof ConnectorsList> = {
    title: 'Features/Wallets/ConnectorsList',
    component: ConnectorsList,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof ConnectorsList>;

export const WithConnectors: Story = {
    render: () => (
        <div style={{ width: '320px' }}>
            <ConnectorsListPreview connectors={mockConnectors} onConnectorSelect={fn()} />
        </div>
    ),
};

export const EmptyState: Story = {
    render: () => (
        <div style={{ width: '320px' }}>
            <ConnectorsListPreview connectors={[]} onConnectorSelect={fn()} />
        </div>
    ),
};

export const SingleConnector: Story = {
    render: () => (
        <div style={{ width: '320px' }}>
            <ConnectorsListPreview connectors={[mockConnectors[0]!]} onConnectorSelect={fn()} />
        </div>
    ),
};
