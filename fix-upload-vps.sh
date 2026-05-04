#!/bin/bash

# Fix Upload Issue - FortiAnalis VPS

echo "=== Fixing Upload Issue ==="
echo ""

VPS_IP="10.60.1.23"

# 1. Update backend CORS to allow VPS IP
echo "1. Updating backend CORS configuration..."
cat > /tmp/fortianalis-backend.service << EOF
[Unit]
Description=FortiAnalis Backend API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/fortianalis/backend
Environment="PATH=/root/fortianalis/backend/venv/bin"
Environment="GEMINI_API_KEY=${GEMINI_API_KEY:-}"
Environment="PYTHONUNBUFFERED=1"
Environment="ALLOWED_ORIGINS=http://${VPS_IP}:3000,http://${VPS_IP},http://localhost:3000,*"
ExecStart=/root/fortianalis/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

cp /tmp/fortianalis-backend.service /etc/systemd/system/fortianalis-backend.service

# 2. Update frontend environment
echo "2. Updating frontend environment..."
cd /root/fortianalis/frontend

cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://${VPS_IP}:8001
EOF

cat > .env.production << EOF
NEXT_PUBLIC_API_URL=http://${VPS_IP}:8001
EOF

# 3. Rebuild frontend
echo "3. Rebuilding frontend..."
npm run build

# 4. Restart services
echo "4. Restarting services..."
systemctl daemon-reload
systemctl restart fortianalis-backend
sleep 3
systemctl restart fortianalis-frontend

# 5. Test
echo ""
echo "5. Testing backend..."
curl -s http://localhost:8001/health
echo ""
curl -s http://${VPS_IP}:8001/health

echo ""
echo "6. Testing CORS..."
curl -H "Origin: http://${VPS_IP}:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://${VPS_IP}:8001/api/v1/upload/ -v

echo ""
echo "=== Fix Complete ==="
echo ""
echo "Services status:"
systemctl status fortianalis-backend --no-pager | head -10
systemctl status fortianalis-frontend --no-pager | head -10

echo ""
echo "Access application at: http://${VPS_IP}:3000"
echo ""
echo "If still not working, check logs:"
echo "  journalctl -u fortianalis-backend -f"
echo "  journalctl -u fortianalis-frontend -f"
