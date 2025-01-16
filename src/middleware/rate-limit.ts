import rateLimit from 'express-rate-limit';
import logger from '../utils/logger';

export const uploadLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 15, // Limit each IP to 15 requests per windowMs
	message: 'Too many upload requests from this IP, please try again later',
	handler: (req, res) => {
		logger.warn('Rate limit exceeded', {
			ip: req.ip,
			path: req.path,
		});
		res.status(429).json({
			error: 'Too many requests, please try again later',
		});
	},
});
