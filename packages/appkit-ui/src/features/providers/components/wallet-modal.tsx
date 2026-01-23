/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { For } from 'solid-js';
import type { WalletProvider } from '@ton/appkit';

export interface WalletModalProps {
    providers: ReadonlyArray<WalletProvider>;
    onSelect: (provider: WalletProvider) => void;
    onClose: () => void;
}

export function WalletModal(props: WalletModalProps) {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'z-index': 1000,
            }}
            onClick={props.onClose}
        >
            <div
                style={{
                    background: 'white',
                    padding: '20px',
                    'border-radius': '8px',
                    'min-width': '300px',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3>Select Wallet</h3>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '10px' }}>
                    <For each={props.providers}>
                        {(provider) => <button onClick={() => props.onSelect(provider)}>{provider.type}</button>}
                    </For>
                </div>
                <button onClick={props.onClose} style={{ 'margin-top': '20px' }}>
                    Cancel
                </button>
            </div>
        </div>
    );
}
