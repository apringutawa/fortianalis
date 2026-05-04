# FortiAnalis VPS Deployment Guide

## Deployment tanpa Docker

### Prerequisites
- VPS dengan Ubuntu 20.04+ atau Debian 11+
- Root access
- Port 80, 3000, dan 8001 terbuka

### Quick Deploy

1. **Login ke VPS sebagai root:**
```bash
ssh root@YOUR_VPS_IP
```

2. **Download dan jalankan script deployment:**
```bash
cd /root
git clone https://github.com/apringutawa/fortianalis.git
cd fortianalis
chmod +x deploy-vps.sh
./deploy-vps.sh
```

3. **Set Gemini API Key:**
```bash
# Edit file service
nano /etc/systemd/system/fortianalis-backend.service

# Ganti baris:
Environment="GEMINI_API_KEY=${GEMINI_API_KEY:-}"
# Menjadi:
Environment="GEMINI_API_KEY=your-actual-api-key-here"

# Reload dan restart
systemctl daemon-reload
systemctl restart fortianalis-backend
```

4. **Cek status services:**
```bash
systemctl status fortianalis-backend
systemctl status fortianalis-frontend
systemctl status nginx
```

5. **Akses aplikasi:**
```
http://YOUR_VPS_IP
```

---

## Manual Deployment (Step by Step)

### 1. Install Dependencies
```bash
apt update
apt install -y python3 python3-pip python3-venv nodejs npm nginx git
```

### 2. Clone Repository
```bash
cd /root
git clone https://github.com/apringutawa/fortianalis.git
cd fortianalis
```

### 3. Setup Backend
```bash
cd /root/fortianalis/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create uploads directory
mkdir -p data/uploads
```

### 4. Setup Frontend
```bash
cd /root/fortianalis/frontend

# Install dependencies
npm install

# Build production
npm run build
```

### 5. Create Systemd Services

**Backend Service:**
```bash
nano /etc/systemd/system/fortianalis-backend.service
```

Paste:
```ini
[Unit]
Description=FortiAnalis Backend API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/fortianalis/backend
Environment="PATH=/root/fortianalis/backend/venv/bin"
Environment="GEMINI_API_KEY=YOUR_API_KEY_HERE"
Environment="PYTHONUNBUFFERED=1"
ExecStart=/root/fortianalis/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Frontend Service:**
```bash
nano /etc/systemd/system/fortianalis-frontend.service
```

Paste:
```ini
[Unit]
Description=FortiAnalis Frontend
After=network.target fortianalis-backend.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/fortianalis/frontend
Environment="NODE_ENV=production"
Environment="NEXT_PUBLIC_API_URL=http://localhost:8001"
Environment="PORT=3000"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 6. Setup Nginx
```bash
nano /etc/nginx/sites-available/fortianalis
```

Paste:
```nginx
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
```

Enable site:
```bash
ln -sf /etc/nginx/sites-available/fortianalis /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
```

### 7. Start Services
```bash
systemctl daemon-reload
systemctl enable fortianalis-backend
systemctl enable fortianalis-frontend
systemctl enable nginx

systemctl start fortianalis-backend
systemctl start fortianalis-frontend
systemctl restart nginx
```

### 8. Verify
```bash
# Check services
systemctl status fortianalis-backend
systemctl status fortianalis-frontend

# Check logs
journalctl -u fortianalis-backend -f
journalctl -u fortianalis-frontend -f

# Test endpoints
curl http://localhost:8001/health
curl http://localhost:3000
```

---

## Update Aplikasi

```bash
cd /root/fortianalis
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
systemctl restart fortianalis-backend

# Update frontend
cd ../frontend
npm install
npm run build
systemctl restart fortianalis-frontend
```

---

## Useful Commands

```bash
# View logs
journalctl -u fortianalis-backend -f
journalctl -u fortianalis-frontend -f

# Restart services
systemctl restart fortianalis-backend
systemctl restart fortianalis-frontend
systemctl restart nginx

# Stop services
systemctl stop fortianalis-backend
systemctl stop fortianalis-frontend

# Check status
systemctl status fortianalis-backend
systemctl status fortianalis-frontend
```
