# FortiAnalis - FortiWeb Log Analyzer

<div align="center">

![FortiAnalis](https://img.shields.io/badge/FortiAnalis-v3.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![Python](https://img.shields.io/badge/Python-3.11-blue)

**Analisa log FortiWeb WAF secara instan dengan AI Security Insight**

[Demo](https://fortianalis.vercel.app) • [Documentation](#dokumentasi) • [Report Issue](https://github.com/apringutawa/fortianalis/issues)

</div>

---

## 📋 Daftar Isi

- [Tentang FortiAnalis](#tentang-fortianalis)
- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Deployment](#deployment)
  - [Local (Docker)](#1-local-deployment-docker)
  - [VPS (Ubuntu/Debian)](#2-vps-deployment-ubuntudebian)
  - [Cloud (Vercel + Railway)](#3-cloud-deployment-vercel--railway)
- [Konfigurasi](#konfigurasi)
- [Penggunaan](#penggunaan)
- [Troubleshooting](#troubleshooting)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

---

## 🎯 Tentang FortiAnalis

FortiAnalis adalah aplikasi web full-stack untuk menganalisis log FortiWeb WAF. Aplikasi ini menyediakan interface yang user-friendly untuk upload file log, memproses data, dan memvisualisasikan insight keamanan secara real-time.

**Dikembangkan oleh KUBU RAYA CSIRT**

---

## ✨ Fitur Utama

- 📤 **Upload Log File** - Support format .log, .txt, .csv (max 50MB)
- 🤖 **AI-Powered Analysis** - Analisis keamanan menggunakan Google Gemini AI
- 📊 **Interactive Dashboard** - Visualisasi serangan, traffic pattern, dan threat intelligence
- 📈 **Timeline Analysis** - Grafik serangan per jam/hari
- 🌍 **Geo-Location** - Pemetaan IP attacker berdasarkan negara
- 📑 **Multi-Format Export** - Export laporan ke PDF, Word, Excel, dan CSV
- 💾 **Report History** - Riwayat analisis tersimpan di database
- 🎨 **Modern UI** - Dark mode dengan Tailwind CSS
- 🔒 **Secure** - CORS protection dan input validation

---

## 🛠 Teknologi

### Frontend
- **Next.js 15.5** - React framework dengan App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Data visualization library
- **Lucide Icons** - Modern icon library

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM untuk database
- **SQLite** - Lightweight database
- **Google Gemini AI** - AI-powered security insights
- **ReportLab** - PDF generation
- **python-docx** - Word document generation
- **openpyxl** - Excel file generation

---

## 🚀 Deployment

### 1. Local Deployment (Docker)

**Prerequisites:**
- Docker Desktop installed
- Git installed

**Steps:**

```bash
# Clone repository
git clone https://github.com/apringutawa/fortianalis.git
cd fortianalis

# Build and run with Docker Compose
docker-compose up --build

# Or run in detached mode
docker-compose up -d
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs

**Stop containers:**
```bash
docker-compose down
```

---

### 2. VPS Deployment (Ubuntu/Debian)

**Prerequisites:**
- VPS dengan Ubuntu 20.04+ atau Debian 11+
- Root access
- Port 80, 3000, dan 8001 terbuka

#### Quick Deploy (Automated)

```bash
# Login ke VPS
ssh root@YOUR_VPS_IP

# Clone repository
git clone https://github.com/apringutawa/fortianalis.git
cd fortianalis

# Run deployment script
chmod +x deploy-vps.sh
./deploy-vps.sh
```

Script akan otomatis:
- Install dependencies (Python, Node.js, Nginx)
- Setup backend dan frontend
- Create systemd services
- Configure Nginx reverse proxy

#### Set Gemini API Key

```bash
# Edit backend service
nano /etc/systemd/system/fortianalis-backend.service

# Ganti baris:
Environment="GEMINI_API_KEY=${GEMINI_API_KEY:-}"
# Menjadi:
Environment="GEMINI_API_KEY=your-actual-api-key-here"

# Reload dan restart
systemctl daemon-reload
systemctl restart fortianalis-backend
```

#### Verify Deployment

```bash
# Check services status
systemctl status fortianalis-backend
systemctl status fortianalis-frontend
systemctl status nginx

# View logs
journalctl -u fortianalis-backend -f
journalctl -u fortianalis-frontend -f

# Test endpoints
curl http://localhost:8001/health
curl http://localhost:3000
```

**Access:** http://YOUR_VPS_IP

#### Update Application

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

#### Useful Commands

```bash
# Restart services
systemctl restart fortianalis-backend
systemctl restart fortianalis-frontend
systemctl restart nginx

# Stop services
systemctl stop fortianalis-backend
systemctl stop fortianalis-frontend

# View logs
journalctl -u fortianalis-backend -n 50
journalctl -u fortianalis-frontend -n 50
```

---

### 3. Cloud Deployment (Vercel + Railway)

#### Deploy Backend to Railway

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Python

3. **Configure Environment Variables**
   ```
   GEMINI_API_KEY=your-gemini-api-key-here
   ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
   ```

4. **Get Railway Domain**
   ```
   https://fortianalis-backend-production.up.railway.app
   ```

#### Deploy Frontend to Vercel

1. **Deploy on Vercel**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your repository
   - Vercel will auto-detect Next.js

2. **Configure Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-domain.up.railway.app
   ```

3. **Deploy**
   Click "Deploy" and wait for build to complete

#### Using CLI

```bash
# Vercel CLI
npm i -g vercel
vercel login
cd frontend
vercel --prod

# Railway CLI
npm i -g @railway/cli
railway login
cd backend
railway init
railway up
```

---

## ⚙️ Konfigurasi

### Environment Variables

#### Backend (.env)
```env
GEMINI_API_KEY=your-gemini-api-key-here
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Docker Compose

File `docker-compose.yml` sudah dikonfigurasi untuk local deployment:
- Backend: Port 8001
- Frontend: Port 3000
- Network: fortianalis-network
- Volume: backend-uploads

---

## 📖 Penggunaan

### 1. Upload Log File

- Klik area upload atau drag & drop file log
- Format yang didukung: .log, .txt, .csv
- Maksimal ukuran file: 50MB

### 2. Analisis Otomatis

Setelah upload, sistem akan:
- Parse log FortiWeb
- Ekstrak data serangan, IP, subdomain
- Analisis dengan AI (jika Gemini API key tersedia)
- Generate visualisasi dashboard

### 3. Export Laporan

Pilih format export:
- **PDF** - Laporan lengkap dengan grafik
- **Word** - Dokumen editable
- **Excel** - Data tabular untuk analisis lanjutan
- **CSV** - Raw data export

### 4. Riwayat Report

Akses menu "Riwayat" untuk melihat:
- Daftar semua analisis sebelumnya
- Download ulang report
- Lihat detail analisis

---

## 🔧 Troubleshooting

### CORS Error

**Problem:** Frontend tidak bisa akses backend

**Solution:**
```bash
# Pastikan ALLOWED_ORIGINS di backend sudah benar
# Untuk VPS:
nano /etc/systemd/system/fortianalis-backend.service
# Tambahkan:
Environment="ALLOWED_ORIGINS=http://YOUR_VPS_IP:3000,http://YOUR_VPS_IP"
systemctl daemon-reload
systemctl restart fortianalis-backend
```

### Upload Failed

**Problem:** "Failed to fetch" saat upload

**Solution:**
1. Cek backend berjalan: `curl http://localhost:8001/health`
2. Cek CORS: `curl -H "Origin: http://localhost:3000" http://localhost:8001/api/v1/upload/`
3. Cek logs: `docker logs fortianalis-backend` atau `journalctl -u fortianalis-backend -f`

### Port Already in Use

**Problem:** Port 3000 atau 8001 sudah digunakan

**Solution:**
```bash
# Stop container lama
docker ps
docker stop <container_id>

# Atau ubah port di docker-compose.yml
ports:
  - "3001:3000"  # Frontend
  - "8002:8001"  # Backend
```

### Build Failed

**Problem:** Docker build error

**Solution:**
```bash
# Clean rebuild
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up
```

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan:

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 Lisensi

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👥 Tim

**KUBU RAYA CSIRT**

- GitHub: [@apringutawa](https://github.com/apringutawa)
- Project Link: [https://github.com/apringutawa/fortianalis](https://github.com/apringutawa/fortianalis)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Google Gemini AI](https://ai.google.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)

---

<div align="center">

**Made with ❤️ by KUBU RAYA CSIRT**

⭐ Star this repo if you find it helpful!

</div>
