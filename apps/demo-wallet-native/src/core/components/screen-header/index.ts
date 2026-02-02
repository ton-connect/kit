/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ScreenHeaderBackButton } from './back-button';
import { ScreenHeaderCancelButton } from './cancel-button';
import { ScreenHeaderCloseButton } from './close-button';
import { ScreenHeaderContainer } from './container';
import { ScreenHeaderLeftSide } from './left-side';
import { ScreenHeaderRightSide } from './right-side';
import { ScreenHeaderTitle } from './title';

export const ScreenHeader = {
    Container: ScreenHeaderContainer,
    Title: ScreenHeaderTitle,
    CloseButton: ScreenHeaderCloseButton,
    CancelButton: ScreenHeaderCancelButton,
    BackButton: ScreenHeaderBackButton,
    LeftSide: ScreenHeaderLeftSide,
    RightSide: ScreenHeaderRightSide,
};
