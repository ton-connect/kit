/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ButtonContainer } from './container';
import { ButtonIcon } from './icon';
import { ButtonText } from './text';

export const AppButton = {
    Container: ButtonContainer,
    Text: ButtonText,
    Icon: ButtonIcon,
};

export type { AppButtonContainerProps } from './container';
export type { AppButtonVariant } from './context';
