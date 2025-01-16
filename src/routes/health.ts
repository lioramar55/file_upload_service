import { Router, Request, Response } from 'express';
import os from 'os';
import logger from '../utils/logger';

const router = Router();

interface HealthStatus {
	status: 'ok' | 'error';
	timestamp: string;
	uptime: number;
	memory: {
		total: number;
		free: number;
		used: number;
	};
	cpu: {
		loadAvg: number[];
	};
}

router.get('/health', async (req: Request, res: Response) => {
	try {
		const totalMemory = os.totalmem();
		const freeMemory = os.freemem();
		const usedMemory = totalMemory - freeMemory;

		const status: HealthStatus = {
			status: 'ok',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			memory: {
				total: Math.round(totalMemory / 1024 / 1024),
				free: Math.round(freeMemory / 1024 / 1024),
				used: Math.round(usedMemory / 1024 / 1024),
			},
			cpu: {
				loadAvg: os.loadavg(),
			},
		};

		logger.debug('Health check requested', status);
		res.json(status);
	} catch (error) {
		logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
		res.status(500).json({
			status: 'error',
			timestamp: new Date().toISOString(),
			error: 'Failed to get system metrics',
		});
	}
});

export default router;
