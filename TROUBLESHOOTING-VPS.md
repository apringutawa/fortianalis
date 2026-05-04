# FortiAnalis VPS Troubleshooting Guide

## Error: "Failed to fetch - Pastikan backend berjalan di http://10.60.1.23:8001"

### Langkah Troubleshooting

#### 1. Jalankan Script Troubleshooting
```bash
cd /root/fortianalis
chmod +x troubleshoot-vps.sh
./troubleshoot-vps.sh
```

#### 2. Cek Manual

**A. Cek apakah backend berjalan:**
```bash
systemctl status fortianalis-backend
journalctl -u fortianalis-backend -n 50
```

**B. Test backend dari VPS:**
```bash
curl http://localhost:8001/health
curl http://10.60.1.23:8001/health
```

**C. Cek port listening:**
```bash
netstat -tulpn | grep 8001
```

**D. Cek firewall:**
```bash
ufw status
# Jika aktif, buka port:
ufw allow 8001/tcp
ufw allow 3000/tcp
ufw allow 80/tcp
```

---

### Solusi Umum

#### Solusi 1: CORS Issue (Paling Umum)

Backend perlu mengizinkan request dari frontend. Edit file backend:

```bash
nano /root/fortianalis/backend/app/main.py
```

Pastikan CORS sudah benar:
```python
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://10.60.1.23:3000,http://10.60.1.23").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Atau set environment variable:
```bash
nano /etc/systemd/system/fortianalis-backend.service
```

Tambahkan:
```ini
Environment="ALLOWED_ORIGINS=http://10.60.1.23:3000,http://10.60.1.23,http://localhost:3000"
```

Restart:
```bash
systemctl daemon-reload
systemctl restart fortianalis-backend
```

---

#### Solusi 2: Frontend Environment Variable

Pastikan frontend menggunakan IP yang benar:

```bash
nano /etc/systemd/system/fortianalis-frontend.service
```

Pastikan ada:
```ini
Environment="NEXT_PUBLIC_API_URL=http://10.60.1.23:8001"
```

Rebuild frontend:
```bash
cd /root/fortianalis/frontend
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://10.60.1.23:8001
EOF

npm run build
systemctl restart fortianalis-frontend
```

---

#### Solusi 3: Gunakan Nginx Reverse Proxy (Recommended)

Dengan nginx, frontend dan backend di domain yang sama (no CORS issue):

```bash
nano /etc/nginx/sites-available/fortianalis
```

Pastikan konfigurasi:
```nginx
server {
    listen 80;
    server_name 10.60.1.23;

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

Update frontend untuk menggunakan relative URL:
```bash
nano /etc/systemd/system/fortianalis-frontend.service
```

Ubah menjadi:
```ini
Environment="NEXT_PUBLIC_API_URL=http://10.60.1.23"
```

Rebuild dan restart:
```bash
cd /root/fortianalis/frontend
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://10.60.1.23
EOF

npm run build
systemctl daemon-reload
systemctl restart fortianalis-frontend
nginx -t
systemctl restart nginx
```

Akses aplikasi di: **http://10.60.1.23** (tanpa port)

---

#### Solusi 4: Firewall/Network Issue

```bash
# Cek firewall
ufw status

# Jika aktif, allow ports
ufw allow 8001/tcp
ufw allow 3000/tcp
ufw allow 80/tcp
ufw reload

# Test dari luar VPS
curl http://10.60.1.23:8001/health
```

---

#### Solusi 5: Backend Tidak Binding ke 0.0.0.0

Pastikan backend listen di semua interface:

```bash
nano /etc/systemd/system/fortianalis-backend.service
```

Pastikan:
```ini
ExecStart=/root/fortianalis/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 2
```

Restart:
```bash
systemctl daemon-reload
systemctl restart fortianalis-backend
```

---

### Quick Fix Script

Jalankan ini untuk fix otomatis:

```bash
#!/bin/bash

# Quick fix for CORS and environment
cd /root/fortianalis

# Update backend CORS
cat >> /etc/systemd/system/fortianalis-backend.service << 'EOF'
Environment="ALLOWED_ORIGINS=http://10.60.1.23:3000,http://10.60.1.23,http://localhost:3000"
EOF

# Update frontend env
cd frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://10.60.1.23:8001
EOF

npm run build

# Restart services
systemctl daemon-reload
systemctl restart fortianalis-backend
systemctl restart fortianalis-frontend

echo "Services restarted. Test at http://10.60.1.23:3000"
```

---

### Verifikasi

Setelah fix, test:

```bash
# Test backend
curl http://10.60.1.23:8001/health

# Test CORS
curl -H "Origin: http://10.60.1.23:3000" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://10.60.1.23:8001/api/v1/upload/ -v

# Cek logs
journalctl -u fortianalis-backend -f
journalctl -u fortianalis-frontend -f
```

Buka browser: **http://10.60.1.23:3000** atau **http://10.60.1.23** (jika pakai nginx)
