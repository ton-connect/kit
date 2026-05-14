/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String } from '@ton/appkit';
import { useSignCell } from '@ton/appkit-react';

export const UseSignCellExample = () => {
    // SAMPLE_START: USE_SIGN_CELL
    const { mutate: signCell, isPending, error, data } = useSignCell();

    const handleSign = () => {
        signCell({
            cell: 'te6cckEBAQEAAgAAAEysuc0=' as Base64String, // Empty cell
            schema: 'nothing#0 = Nothing',
        });
    };

    return (
        <div>
            <button onClick={handleSign} disabled={isPending}>
                {isPending ? 'Signing...' : 'Sign Cell'}
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
    // SAMPLE_END: USE_SIGN_CELL
};
