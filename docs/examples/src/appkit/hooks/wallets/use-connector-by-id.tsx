/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useConnectorById } from '@ton/appkit-react';

export const UseConnectorByIdExample = () => {
    // SAMPLE_START: USE_CONNECTOR_BY_ID
    const connector = useConnectorById('injected');

    if (!connector) {
        return <div>Injected connector not found</div>;
    }

    return (
        <div>
            <h3>Connector Details:</h3>
            <p>ID: {connector.id}</p>
            <p>Type: {connector.type}</p>
        </div>
    );
    // SAMPLE_END: USE_CONNECTOR_BY_ID
};
