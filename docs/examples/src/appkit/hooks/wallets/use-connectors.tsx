/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useConnect, useConnectors } from '@ton/appkit-react';

export const UseConnectorsExample = () => {
    // SAMPLE_START: USE_CONNECTORS
    const connectors = useConnectors();
    const { mutate: connect } = useConnect();

    return (
        <div>
            <h3>Available Connectors:</h3>
            <ul>
                {connectors.map((connector) => (
                    <li key={connector.id}>
                        <button onClick={() => connect({ connectorId: connector.id })}>{connector.type}</button>
                    </li>
                ))}
            </ul>
        </div>
    );
    // SAMPLE_END: USE_CONNECTORS
};
