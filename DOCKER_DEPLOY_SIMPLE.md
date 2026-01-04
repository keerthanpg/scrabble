# 🐶 Simple Docker Deployment (Everything Containerized)

This is the **easiest way** to deploy Puggle - everything runs in Docker, including Nginx!

## What's Included

- ✅ Puggle game (Node.js) in Docker
- ✅ Nginx reverse proxy in Docker
- ✅ Automatic SSL setup script
- ✅ Rating persistence
- ✅ No manual Nginx installation needed!

---

## Prerequisites

- Digital Ocean droplet (Ubuntu 20.04+)
- Docker and Docker Compose installed
- Domain name (for HTTPS) or use HTTP with IP

---

## Quick Start (3 Steps)

### 1. Install Docker

```bash
# SSH into droplet
ssh root@your_droplet_ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose git

# Verify
docker --version
docker-compose --version
```

### 2. Clone and Start

```bash
# Clone repository
mkdir -p /var/www && cd /var/www
git clone https://github.com/keerthanpg/scrabble.git puggle
cd puggle

# Start everything (app + nginx)
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```

**That's it!** Visit: `http://YOUR_DROPLET_IP`

---

## Add HTTPS (Optional)

### For Subdomain (Recommended)

**DNS Setup:**
```
Type: A Record
Name: scrabble
Value: YOUR_DROPLET_IP
```

**Run SSL Setup:**
```bash
cd /var/www/puggle
chmod +x setup-ssl.sh
./setup-ssl.sh scrabble.keerthanapg.com your-email@example.com
```

Visit: `https://scrabble.keerthanapg.com` 🔒

### Manual SSL Setup (Alternative)

```bash
# Update nginx config with your domain
nano nginx/nginx.conf
# Change server_name _ to server_name your-domain.com

# Restart
docker-compose restart nginx

# Get certificate
apt install -y certbot
certbot certonly --webroot -w ./nginx/certbot -d your-domain.com

# Copy certificates
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/

# Use SSL config template
cp nginx/nginx-ssl.conf.template nginx/nginx.conf
sed -i "s/DOMAIN_NAME/your-domain.com/g" nginx/nginx.conf

# Restart
docker-compose restart nginx
```

---

## Firewall Setup

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## Update Deployment

```bash
cd /var/www/puggle
git pull origin main
docker-compose down
docker-compose up -d --build
```

---

## Docker Commands

```bash
# View logs
docker-compose logs -f

# View specific service
docker-compose logs -f nginx
docker-compose logs -f puggle

# Check status
docker-compose ps

# Restart services
docker-compose restart

# Stop everything
docker-compose down

# Stop and remove volumes (CAUTION: deletes ratings)
docker-compose down -v

# View ratings
docker exec puggle-game cat /app/data/ratings.json
```

---

## Troubleshooting

### Port 80 already in use
```bash
# Find what's using port 80
sudo lsof -i :80

# If it's old nginx, remove it
sudo systemctl stop nginx
sudo systemctl disable nginx
sudo apt remove nginx

# Restart Docker
docker-compose restart
```

### Container won't start
```bash
# Check logs
docker-compose logs

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### SSL certificate issues
```bash
# Check certbot logs
cat /var/log/letsencrypt/letsencrypt.log

# Make sure DNS is correct
nslookup your-domain.com

# Re-run SSL setup
./setup-ssl.sh your-domain.com your-email@example.com
```

---

## Architecture

```
Internet
    ↓
  Port 80/443
    ↓
[Nginx Container] ← nginx/nginx.conf
    ↓
  Port 3000
    ↓
[Puggle Container] ← Dockerfile
    ↓
[Ratings Volume] ← data/ratings.json
```

Everything runs in Docker - no manual Nginx installation needed! 🐳

---

## Comparison

**This Method (Simple):**
- ✅ Everything in Docker
- ✅ One command to deploy
- ✅ Easy to update
- ✅ Portable

**Traditional Method (DEPLOY.md):**
- Nginx on host
- App in Docker
- More manual steps
- More control

Both work great - choose based on your preference! 🚀
