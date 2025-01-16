# Image Upload Microservice

A Node.js microservice for handling image uploads with automatic optimization and compression.

## Features

- Image upload with automatic optimization
- Environment-specific configurations (development/production)
- Image compression and resizing
- File type validation
- Rotating logs with Winston
- CORS support
- TypeScript support
- API Key authentication
- Rate limiting
- Health monitoring endpoint

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=3000
DEV_UPLOAD_DIR=uploads/dev
PROD_UPLOAD_DIR=uploads/prod
DEV_BASE_URL=http://localhost:3000
PROD_BASE_URL=https://your-domain.com
MAX_FILE_SIZE=5
API_KEY=your-secure-api-key-here
```

## Development

Run the service in development mode:

```bash
npm run dev
```

## Production Deployment

1. Build the TypeScript code:

```bash
npm run build
```

2. Set environment variables:

```bash
export NODE_ENV=production
export API_KEY=your-secure-api-key
```

Or create a systemd service file (recommended).

3. Start the service:

```bash
npm start
```

### Setting up as a systemd service

Create a systemd service file `/etc/systemd/system/image-upload.service`:

```ini
[Unit]
Description=Image Upload Service
After=network.target

[Service]
Environment=NODE_ENV=production
Environment=API_KEY=your-secure-api-key
WorkingDirectory=/path/to/your/app
ExecStart=/usr/bin/npm start
Restart=always
User=your-user
Group=your-group

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl enable image-upload
sudo systemctl start image-upload
```

## API Usage

### Authentication

All API endpoints (except health check) require an API key to be sent in the `X-API-Key` header:

```
X-API-Key: your-api-key
```

### Rate Limiting

The upload endpoint is rate-limited to 100 requests per 15 minutes per IP address.

### Upload Image

**Endpoint:** `POST /api/upload`

**Request:**

- Method: POST
- Content-Type: multipart/form-data
- Headers:
  - X-API-Key: your-api-key
- Body:
  - image: File (supported formats: JPEG, PNG, GIF, WebP)

**Response:**

```json
{
	"success": true,
	"url": "http://your-domain.com/uploads/filename.jpg",
	"filename": "timestamp-filename.jpg"
}
```

### Health Check

**Endpoint:** `GET /api/health`

No authentication required. Returns system health metrics.

**Response:**

```json
{
	"status": "ok",
	"timestamp": "2024-02-20T12:00:00Z",
	"uptime": 3600,
	"memory": {
		"total": 8192,
		"free": 4096,
		"used": 4096
	},
	"cpu": {
		"loadAvg": [1.5, 1.2, 1.0]
	}
}
```

## Logging

Logs are stored in the `logs` directory with daily rotation:

- Maximum file size: 20MB
- Retention: 14 days
- Format: JSON
- Compressed archives

## Nginx Configuration (Production)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /path/to/your/uploads/directory;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

## Security Considerations

1. Set up SSL/TLS certificates
2. Configure proper file permissions
3. Use a strong API key in production
4. Set up proper firewall rules
5. Regular security updates
6. Monitor rate limiting and failed authentication attempts

## License

ISC
