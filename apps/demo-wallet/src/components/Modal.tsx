/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

export const ModalContainer: React.FC<ModalProps> = ({ isOpen, onClose, children, className = '' }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={handleBackdropClick}>
            <div
                className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
};

interface ModalHeaderProps {
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ children, onClose, className = '' }) => {
    return (
        <div className={`px-6 py-4 ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">{children}</div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

interface ModalTitleProps {
    children: React.ReactNode;
    className?: string;
}

export const ModalTitle: React.FC<ModalTitleProps> = ({ children, className = '' }) => {
    return <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>;
};

interface ModalBodyProps {
    children: React.ReactNode;
    className?: string;
}

export const ModalBody: React.FC<ModalBodyProps> = ({ children, className = '' }) => {
    return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

interface ModalFooterProps {
    children: React.ReactNode;
    className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className = '' }) => {
    return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

export const Modal = {
    Container: ModalContainer,
    Header: ModalHeader,
    Title: ModalTitle,
    Body: ModalBody,
    Footer: ModalFooter,
};
