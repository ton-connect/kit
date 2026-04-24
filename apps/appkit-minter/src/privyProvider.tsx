/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import type { PrivyProviderProps } from '@privy-io/react-auth';
import { PrivyBridge } from '@ton/appkit-react';
import type { PrivyBridgeProps } from '@ton/appkit-react';

import { ENV_PRIVY_APP_ID } from '@/core/configs/env';

export const AppPrivyProvider: FC<Omit<PrivyProviderProps, 'appId' | 'config'>> = ({ children, ...props }) => {
    return ENV_PRIVY_APP_ID ? (
        <PrivyProvider {...props} appId={ENV_PRIVY_APP_ID} config={{ loginMethods: ['telegram'] }}>
            <>{children}</>
        </PrivyProvider>
    ) : (
        <>{children}</>
    );
};

export const PrivyBridgeProvider: FC<PrivyBridgeProps> = ({ children, ...props }) => {
    return <>{ENV_PRIVY_APP_ID ? <PrivyBridge {...props}>{children}</PrivyBridge> : <>{children}</>}</>;
};
