import { Request, Response, NextFunction } from 'express';

import { ApiError } from '../types/api.js';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    // eslint-disable-next-line no-console
    console.error('Error:', err);

    const error: ApiError = {
        error: {
            code: 'INTERNAL_ERROR',
            message: err.message || 'Internal server error',
        },
    };

    res.status(500).json(error);
};

export const notFoundHandler = (req: Request, res: Response): void => {
    const error: ApiError = {
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
    };

    res.status(404).json(error);
};
