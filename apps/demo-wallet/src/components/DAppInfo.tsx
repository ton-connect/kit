/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';

interface DAppInfoProps {
    /** dApp name */
    name?: string;
    /** dApp description */
    description?: string;
    /** dApp URL */
    url?: string;
    /** dApp icon URL */
    iconUrl?: string;
    /** Optional additional className */
    className?: string;
}

export const DAppInfo: React.FC<DAppInfoProps> = ({ name, description, url, iconUrl, className = '' }) => {
    let hostname;
    try {
        hostname = url ? new URL(url).hostname : undefined;
    } catch (_error) {
        hostname = url;
    }

    return (
        <div className={`border rounded-lg p-4 bg-gray-50 ${className}`}>
            <div className="flex items-center space-x-4">
                {/* dApp Icon */}
                {iconUrl ? (
                    <img
                        src={iconUrl}
                        alt={name}
                        className="w-12 h-12 rounded-lg object-cover border"
                        onError={(e) => {
                            // Hide image if it fails to load
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{name || 'Unknown dApp'}</h3>
                    {description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>}
                    {hostname && <p className="text-xs text-gray-500 mt-1 truncate">{hostname}</p>}
                </div>
            </div>
        </div>
    );
};
