/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { FC, ComponentProps } from 'react';
export interface TonIconProps extends Omit<ComponentProps<'svg'>, 'width' | 'height'> {
    size?: number;
}
export declare const TonIcon: FC<TonIconProps>;
export declare const TonIconCircle: FC<TonIconProps>;
//# sourceMappingURL=ton-icon.d.ts.map