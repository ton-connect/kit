/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createSignal, Show } from 'solid-js';

import { WalletModal } from './wallet-modal';

import { useAppKit } from '~/core/context/app-kit-context';

export function ConnectButton() {
    const { connectedWallets, providers, connectWallet } = useAppKit();
    const [showModal, setShowModal] = createSignal(false);

    const handleClick = () => {
        if (connectedWallets().length > 0) {
            // Do nothing if connected, as per requirements
            return;
        }

        if (providers.length === 1) {
            connectWallet(providers[0]);
        } else {
            setShowModal(true);
        }
    };

    return (
        <>
            <button onClick={handleClick}>
                {connectedWallets().length > 0 ? `Connected (${connectedWallets().length})` : 'Connect Wallet'}
            </button>

            <Show when={showModal()}>
                <WalletModal
                    providers={providers}
                    onSelect={(p) => {
                        connectWallet(p);
                        setShowModal(false);
                    }}
                    onClose={() => setShowModal(false)}
                />
            </Show>
        </>
    );
}
