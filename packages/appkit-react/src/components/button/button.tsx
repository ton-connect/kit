/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ComponentProps } from 'react';
import clsx from 'clsx';

import styles from './button.module.css';

export const Button: FC<ComponentProps<'button'>> = ({ className, ...props }) => {
    return <button className={clsx(styles.button, className)} {...props} />;
};
