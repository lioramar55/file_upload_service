#!/bin/bash
set -e  # Exit on error

# Configuration
SERVER="${SERVER_IP}"
USER="${SERVER_USER}"
REMOTE_PATH="${SERVER_REMOTE_PATH}"
BACKUP_PATH="${SERVER_BACKUP_PATH}"
APP_NAME="file-upload-service"

echo "Starting deployment process..."

# Check if package.json exists locally
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found in current directory"
    exit 1
fi

# Connect to server and prepare directories
ssh $USER@$SERVER << EOF
    # Create directories if they don't exist
    mkdir -p ${REMOTE_PATH}
    mkdir -p ${BACKUP_PATH}

    # If there's an existing deployment, create backup
    if [ -d "${REMOTE_PATH}" ] && [ "\$(ls -A ${REMOTE_PATH})" ]; then
        echo "Creating backup of existing deployment..."
        rm -rf ${BACKUP_PATH}/*
        cp -r ${REMOTE_PATH}/* ${BACKUP_PATH}/ 2>/dev/null || true
    fi

    # Stop existing PM2 process if running
    if pm2 list | grep -q "${APP_NAME}"; then
        echo "Stopping existing PM2 process..."
        pm2 stop ${APP_NAME}
        pm2 delete ${APP_NAME}
    fi
EOF

# Copy essential files to server
echo "Copying files to server..."
scp -r src package.json package-lock.json tsconfig.json .env $USER@$SERVER:$REMOTE_PATH/

# Setup and start on the server
ssh $USER@$SERVER << EOF
    cd ${REMOTE_PATH}

    # Install PM2 globally if not installed
    if ! command -v pm2 &> /dev/null; then
        echo "Installing PM2..."
        sudo npm install -g pm2
    fi

    # Install dependencies
    echo "Installing dependencies..."
    npm install --omit=dev

    echo "Starting service with PM2..."
    # Start the service with PM2
    NODE_ENV=production pm2 start index.ts \
        --name "${APP_NAME}" \
        --interpreter "node" \
        --interpreter-args "-r ts-node/register" \
        --time \
        --max-memory-restart 300M

    # Save PM2 configuration
    pm2 save

    echo "Deployment completed successfully!"
EOF

echo "Local cleanup completed!" 