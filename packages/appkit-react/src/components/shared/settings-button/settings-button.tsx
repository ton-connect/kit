/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';
import clsx from 'clsx';

import { Button } from '../../ui/button';
import { SlidersIcon } from '../../ui/icons';
import styles from './settings-button.module.css';

/**
 * Props accepted by {@link SettingsButton} — extends the base {@link Button} props.
 *
 * @public
 * @category Type
 * @section Shared
 */
export interface SettingsButtonProps extends ComponentProps<typeof Button> {
    /** Click handler — typically used to open a settings modal. */
    onClick?: () => void;
}

/**
 * Icon-only secondary button with a sliders icon — drop-in trigger for opening settings panels.
 *
 * @sample docs/examples/src/appkit/components/shared#SETTINGS_BUTTON
 *
 * @public
 * @category Component
 * @section Shared
 */
export const SettingsButton: FC<SettingsButtonProps> = ({ onClick, className, ...props }) => {
    return (
        <Button
            className={clsx(styles.settingsButton, className)}
            variant="secondary"
            size="l"
            borderRadius="l"
            onClick={onClick}
            {...props}
        >
            <SlidersIcon />
        </Button>
    );
};
