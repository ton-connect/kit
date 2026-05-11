/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps } from 'react';

/**
 * Standard props for all icon components.
 *
 * Icons render an `<svg>` whose dimensions are controlled by `size`. Color is
 * inherited from `currentColor`, so style icons by setting `color` on a parent.
 *
 * @public
 * @category Type
 * @section UI
 */
export interface IconProps extends Omit<ComponentProps<'svg'>, 'width' | 'height'> {
    /** Square size of the icon in pixels. Defaults to {@link DEFAULT_ICON_SIZE}. */
    size?: number;
}

/**
 * Default size in pixels (24) applied to icons when `size` is not provided.
 *
 * @public
 * @category Constants
 * @section UI
 */
export const DEFAULT_ICON_SIZE = 24;
