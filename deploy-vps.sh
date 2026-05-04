#!/bin/bash

# FortiAnalis VPS Deployment Script (Without Docker) - Simplified
# Run this script on your VPS

set -e

echo "=== FortiAnalis VPS Deployment (Simplified) ==="
echo ""

# Configuration
BACKEND_PORT=8001
FRONTEND_PORT=3000
PROJECT_DIR="/root/fortianalis"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root or with sudo"
    exit 1
fi

# Install system dependencies
echo "Installing system dependencies..."
apt update
apt install -y python3 python3-pip python3-venv nodejs npm git

# Clone repository if not exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo "Cloning repository..."
    git clone https://github.com/apringutawa/fortianalis.git $PROJECT_DIR
fi

cd $PROJECT_DIR

# Setup Backend
echo ""
echo "=== Setting up Backend ==="
cd $PROJECT_DIR/backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate and install dependencies
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create uploads directory
mkdir -p data/uploads

# Create systemd service for backend
echo "Creating backend systemd service..."
cat > /etc/systemd/system/fortianalis-backend.service << EOF
[Unit]
Description=FortiAnalis Backend API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR/backend
Environment="PATH=$PROJECT_DIR/backend/venv/bin"
Environment="GEMINI_API_KEY=${GEMINI_API_KEY:-}"
Environment="PYTHONUNBUFFERED=1"
ExecStart=$PROJECT_DIR/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Setup Frontend
echo ""
echo "=== Setting up Frontend ==="
cd $PROJECT_DIR/frontend

# Install dependencies and build
echo "Installing frontend dependencies..."
npm install
echo "Building frontend..."
npm run build

# Create systemd service for frontend
echo "Creating frontend systemd service..."
cat > /etc/systemd/system/fortianalis-frontend.service << EOF
[Unit]
Description=FortiAnalis Frontend
After=network.target fortianalis-backend.service

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR/frontend
Environment="NODE_ENV=production"
Environment="NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT"
Environment="PORT=$FRONTEND_PORT"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Setup Nginx reverse proxy
echo ""
echo "=== Setting up Nginx ==="
cat > /etc/nginx/sites-available/fortianalis << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
EOF

# Enable nginx site
ln -sf /etc/nginx/sites-available/fortianalis /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Reload systemd and start services
echo ""
echo "=== Starting services ==="
systemctl daemon-reload
systemctl enable fortianalis-backend
systemctl enable fortianalis-frontend
systemctl enable nginx

systemctl restart fortianalis-backend
systemctl restart fortianalis-frontend
systemctl restart nginx

echo ""
echo "=== Deployment Complete! ==="
echo ""
echo "Access your application at: http://YOUR_VPS_IP"
echo ""
echo "IMPORTANT: Set your Gemini API key:"
echo "  export GEMINI_API_KEY='your-api-key-here'"
echo "  systemctl daemon-reload && systemctl restart fortianalis-backend"
echo ""
echo "Useful commands:"
echo "  - View backend logs: journalctl -u fortianalis-backend -f"
echo "  - View frontend logs: journalctl -u fortianalis-frontend -f"
echo "  - Restart backend: systemctl restart fortianalis-backend"
echo "  - Restart frontend: systemctl restart fortianalis-frontend"
