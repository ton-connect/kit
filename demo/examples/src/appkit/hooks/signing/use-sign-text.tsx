/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSignText } from '@ton/appkit-react';

export const UseSignTextExample = () => {
    // SAMPLE_START: USE_SIGN_TEXT
    const { mutate: signText, isPending, error, data } = useSignText();

    const handleSign = () => {
        signText({ text: 'Hello, TON!' });
    };

    return (
        <div>
            <button onClick={handleSign} disabled={isPending}>
                {isPending ? 'Signing...' : 'Sign Text'}
            </button>
            {error && <div>Error: {error.message}</div>}
            {data && (
                <div>
                    <h4>Signature:</h4>
                    <pre>{data.signature}</pre>
                </div>
            )}
        </div>
    );
    // SAMPLE_END: USE_SIGN_TEXT
};
