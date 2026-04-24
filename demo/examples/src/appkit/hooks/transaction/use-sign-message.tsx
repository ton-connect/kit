/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSignMessage } from '@ton/appkit-react';

export const UseSignMessageExample = () => {
    // SAMPLE_START: USE_SIGN_MESSAGE
    const { mutate: signMessage, isPending, error, data } = useSignMessage();

    const handleSign = () => {
        signMessage({
            validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
            messages: [
                {
                    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                    amount: '100000000', // 0.1 TON in nanotons
                },
            ],
        });
    };

    return (
        <div>
            <button onClick={handleSign} disabled={isPending}>
                {isPending ? 'Signing...' : 'Sign Message'}
            </button>
            {error && <div>Error: {error.message}</div>}
            {data && (
                <div>
                    <h4>Message Signed!</h4>
                    <p>Internal BOC: {data.internalBoc}</p>
                </div>
            )}
        </div>
    );
    // SAMPLE_END: USE_SIGN_MESSAGE
};
