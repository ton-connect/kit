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

export interface SettingsButtonProps extends ComponentProps<typeof Button> {
    onClick?: () => void;
}

export const SettingsButton: FC<SettingsButtonProps> = ({ onClick, className, ...props }) => {
    return (
        <Button
            className={clsx(styles.settingsButton, className)}
            variant="gray"
            size="l"
            borderRadius="l"
            onClick={onClick}
            {...props}
        >
            <SlidersIcon />
        </Button>
    );
};
