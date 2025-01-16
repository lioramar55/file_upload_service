import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
	const apiKey = req.header('X-API-Key');

	if (!process.env.API_KEY) {
		logger.error('API_KEY not set in environment variables');
		res.status(500).json({ error: 'Server configuration error' });
		return;
	}

	if (!apiKey) {
		logger.warn('API key missing in request');
		res.status(401).json({ error: 'API key is required' });
		return;
	}

	if (apiKey !== process.env.API_KEY) {
		logger.warn('Invalid API key attempt', { providedKey: apiKey });
		res.status(403).json({ error: 'Invalid API key' });
		return;
	}

	next();
};
