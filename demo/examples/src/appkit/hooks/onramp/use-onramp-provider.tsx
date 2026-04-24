/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useOnrampProvider } from '@ton/appkit-react';

export const UseOnrampProviderExample = () => {
    // SAMPLE_START: USE_ONRAMP_PROVIDER
    const provider = useOnrampProvider({ id: 'moonpay' });

    return <div>Provider: {provider?.providerId}</div>;
    // SAMPLE_END: USE_ONRAMP_PROVIDER
};
