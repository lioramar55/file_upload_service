import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './src/utils/logger';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Environment-specific configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const uploadDir = isDevelopment ? process.env.DEV_UPLOAD_DIR : process.env.PROD_UPLOAD_DIR;
const baseUrl = isDevelopment ? process.env.DEV_BASE_URL : process.env.PROD_BASE_URL;
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '5') * 1024 * 1024;

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir!)) {
	fs.mkdirSync(uploadDir!, { recursive: true });
}

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
	storage,
	limits: {
		fileSize: maxFileSize,
	},
	fileFilter: (req, file, cb) => {
		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
		if (!allowedTypes.includes(file.mimetype)) {
			cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
			return;
		}
		cb(null, true);
	},
});

// Serve static files
app.use('/uploads', express.static(uploadDir!));

// Image upload endpoint
app.post('/upload', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.file) {
			logger.warn('Upload attempt with no file');
			res.status(400).json({ error: 'No file uploaded' });
			return;
		}

		const file = req.file;
		const timestamp = Date.now();
		const filename = `${timestamp}-${file.originalname}`;
		const outputPath = path.join(uploadDir!, filename);

		logger.info(`Processing upload: ${filename}`, {
			originalName: file.originalname,
			size: file.size,
			mimetype: file.mimetype,
		});

		// Optimize and save the image
		await sharp(file.buffer)
			.resize(1920, 1080, {
				fit: 'inside',
				withoutEnlargement: true,
			})
			.jpeg({ quality: 80 })
			.toFile(outputPath);

		const imageUrl = `${baseUrl}/uploads/${filename}`;
		logger.info(`Upload successful: ${filename}`, { url: imageUrl });

		res.json({
			success: true,
			url: imageUrl,
			filename: filename,
		});
	} catch (error) {
		logger.error('Error processing upload:', { error: error instanceof Error ? error.message : 'Unknown error' });
		res.status(500).json({ error: 'Failed to process upload' });
	}
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
	if (err instanceof multer.MulterError) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			logger.warn('File size limit exceeded', { maxSize: process.env.MAX_FILE_SIZE });
			res.status(400).json({
				error: `File size too large. Maximum size is ${process.env.MAX_FILE_SIZE}MB`,
			});
			return;
		}
	}
	logger.error('Unhandled error:', { error: err.message });
	res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	logger.info(`Server running in ${process.env.NODE_ENV} mode`, {
		port: PORT,
		uploadDirectory: uploadDir,
		baseUrl: baseUrl,
	});
});
