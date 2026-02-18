/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String } from '@ton/appkit';
import { useSignBinary } from '@ton/appkit-react';

export const UseSignBinaryExample = () => {
    // SAMPLE_START: USE_SIGN_BINARY
    const { mutate: signBinary, isPending, error, data } = useSignBinary();

    const handleSign = () => {
        // Sign "Hello" in binary (Base64: SGVsbG8=)
        signBinary({ bytes: 'SGVsbG8=' as Base64String });
    };

    return (
        <div>
            <button onClick={handleSign} disabled={isPending}>
                {isPending ? 'Signing...' : 'Sign Binary'}
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
    // SAMPLE_END: USE_SIGN_BINARY
};
