#!/bin/bash

# FortiAnalis VPS Troubleshooting Script

echo "=== FortiAnalis Troubleshooting ==="
echo ""

# 1. Check if services are running
echo "1. Checking services status..."
systemctl status fortianalis-backend --no-pager
systemctl status fortianalis-frontend --no-pager
systemctl status nginx --no-pager

echo ""
echo "2. Checking if ports are listening..."
netstat -tulpn | grep -E ':(8001|3000|80)'

echo ""
echo "3. Testing backend health..."
curl -v http://localhost:8001/health
curl -v http://10.60.1.23:8001/health

echo ""
echo "4. Testing backend root..."
curl -v http://localhost:8001/

echo ""
echo "5. Checking backend logs (last 30 lines)..."
journalctl -u fortianalis-backend -n 30 --no-pager

echo ""
echo "6. Checking frontend logs (last 30 lines)..."
journalctl -u fortianalis-frontend -n 30 --no-pager

echo ""
echo "7. Checking nginx logs..."
tail -20 /var/log/nginx/error.log

echo ""
echo "8. Checking firewall status..."
ufw status

echo ""
echo "9. Testing CORS..."
curl -H "Origin: http://10.60.1.23:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://10.60.1.23:8001/api/v1/upload/ -v

echo ""
echo "=== Troubleshooting Complete ==="
