/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';

import { TraceRow } from '../components/TraceRow';

export const TracePage: React.FC = () => {
    const { traceId: fullTraceId } = useParams<{ traceId: string }>();
    const traceId = fullTraceId?.split(':')?.[0];
    const extHash = fullTraceId?.split(':')?.[1];

    if (!traceId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Trace</h2>
                    <p className="text-gray-600 mb-4">No trace ID provided</p>
                    <Link
                        to="/wallet"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                        Back to Wallet
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center space-x-4 mb-4">
                        <Link
                            to="/wallet"
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Back to wallet"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Trace Details</h1>
                            <p className="text-sm text-gray-500 font-mono">ID: {traceId}</p>
                        </div>
                    </div>
                </div>

                {/* Trace Content */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Transaction Trace</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Complete trace information for all transactions in this group
                        </p>
                    </div>
                    <div className="p-6">
                        <TraceRow externalHash={extHash} traceId={traceId} isPending={false} />

                        {/* Additional trace information could be added here in the future */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                                This page will be expanded to show detailed trace information including:
                            </p>
                            <ul className="mt-2 text-sm text-gray-500 list-disc list-inside space-y-1">
                                <li>Individual transaction details</li>
                                <li>Message flow visualization</li>
                                <li>Action breakdown</li>
                                <li>Fee analysis</li>
                                <li>Smart contract interactions</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
