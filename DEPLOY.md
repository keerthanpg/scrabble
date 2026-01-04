# 🐶 Puggle Deployment Guide - Digital Ocean

Complete guide to deploy your pug-themed Puggle game on a Digital Ocean droplet using Docker.

## Features

- 🎮 **Matchmaking System**: Players can find and play against strangers with skill-based matchmaking
- ⭐ **ELO Rating System**: Automatic skill ratings that persist across games
- 🎯 **Smart Matching**: Matches players with similar ratings (±150 → ±300 → anyone after 60s)
- 🐾 **Pug-Themed UI**: Beautiful, playful design with animations
- 🎲 **Classic Scrabble**: Full Scrabble game with 15x15 board and 178,000+ word dictionary

## Prerequisites

- Digital Ocean droplet (Ubuntu 20.04 or 22.04 recommended)
- SSH access to your droplet
- Domain name (optional, but recommended for SSL)

---

## 🐳 Method 1: Docker Deployment (Recommended)

This is the easiest and most reliable way to deploy!

### Step 1: Initial Server Setup

SSH into your droplet:
```bash
ssh root@your_droplet_ip
```

Update system packages:
```bash
apt update && apt upgrade -y
```

---

### Step 2: Install Docker and Docker Compose

Install Docker:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

Install Docker Compose:
```bash
apt install -y docker-compose
```

Verify installation:
```bash
docker --version
docker-compose --version
```

---

### Step 3: Install Git

```bash
apt install -y git
```

---

### Step 4: Clone Your Repository

Create app directory:
```bash
mkdir -p /var/www
cd /var/www
```

Clone the repository:
```bash
git clone https://github.com/keerthanpg/scrabble.git puggle
cd puggle
```

---

### Step 5: Build and Run with Docker

Build and start the container:
```bash
docker-compose up -d --build
```

That's it! Your app is now running! 🎉

**Note:** Player ratings are automatically persisted in a Docker volume. This means ratings will survive container restarts and updates!

Check if it's running:
```bash
docker-compose ps
```

View logs:
```bash
docker-compose logs -f
```

Check ratings data:
```bash
docker exec puggle-game cat /app/data/ratings.json
```

---

### Step 6: Configure Firewall

Allow SSH, HTTP, and HTTPS:
```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

Check firewall status:
```bash
ufw status
```

Your app is now running on port 3000. Next, configure Nginx to proxy requests to it.

---

### Step 7: Install and Configure Nginx (Reverse Proxy)

Install Nginx:
```bash
apt install -y nginx
```

Create Nginx configuration:
```bash
nano /etc/nginx/sites-available/puggle
```

Add this configuration (replace `your_domain.com` with your actual domain):
```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # WebSocket support
        proxy_read_timeout 86400;
    }
}
```

**If you don't have a domain yet**, use IP-based config:
```nginx
server {
    listen 80 default_server;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # WebSocket support
        proxy_read_timeout 86400;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/puggle /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Remove default site
```

Test Nginx configuration:
```bash
nginx -t
```

Restart Nginx:
```bash
systemctl restart nginx
```

Now visit `http://your_droplet_ip` (without port 3000!)

---

### Step 8: Setup SSL with Let's Encrypt (Optional but Recommended)

**Skip this if you don't have a domain name yet.**

Install Certbot:
```bash
apt install -y certbot python3-certbot-nginx
```

Obtain SSL certificate (replace with your domain):
```bash
certbot --nginx -d your_domain.com -d www.your_domain.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose to redirect HTTP to HTTPS (option 2)

Certbot will automatically configure Nginx for SSL!

Test automatic renewal:
```bash
certbot renew --dry-run
```

---

### Step 9: Update Your Application

To deploy updates in the future:

```bash
cd /var/www/puggle
git pull origin main
docker-compose down
docker-compose up -d --build
```

Or use this one-liner:
```bash
cd /var/www/puggle && git pull origin main && docker-compose up -d --build
```

---

### Docker Management Commands

```bash
# Check container status
docker-compose ps

# View logs (follow mode)
docker-compose logs -f

# View logs (last 100 lines)
docker-compose logs --tail=100

# Restart container
docker-compose restart

# Stop container
docker-compose stop

# Start container
docker-compose start

# Stop and remove container (keeps ratings data)
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Check container health
docker inspect puggle-game | grep -A 5 Health

# Access container shell (for debugging)
docker exec -it puggle-game sh

# View container resource usage
docker stats puggle-game

# Ratings data management
docker exec puggle-game cat /app/data/ratings.json  # View ratings
docker volume ls                                     # List volumes
docker volume inspect chinniproject_ratings-data    # Inspect ratings volume
```

---

### Quick Reference Commands

```bash
# App management
docker-compose ps              # Check app status
docker-compose logs -f         # View logs
docker-compose restart         # Restart app
docker-compose up -d --build   # Rebuild and restart

# Nginx
systemctl status nginx         # Check Nginx status
systemctl restart nginx        # Restart Nginx

# System
ufw status                     # Check firewall
htop                          # Monitor server resources
df -h                         # Check disk space
docker system prune -a        # Clean up Docker (careful!)
```

---

### Troubleshooting (Docker)

#### Container not starting
```bash
docker-compose logs puggle  # Check error logs
docker-compose restart
docker-compose down && docker-compose up -d  # Full restart
```

#### Port 3000 already in use
```bash
# Find what's using port 3000
lsof -i :3000
# or
netstat -tulpn | grep 3000

# Stop the Docker container
docker-compose down

# If something else is using it, kill that process
kill -9 <PID>
```

#### Container keeps restarting
```bash
docker-compose logs --tail=50  # Check recent logs
docker inspect puggle-game     # Check container details
```

#### Out of disk space
```bash
df -h                          # Check disk usage
docker system df               # Check Docker disk usage
docker system prune -a         # Clean up (removes all unused images!)
```

#### Nginx errors
```bash
nginx -t  # Test configuration
tail -f /var/log/nginx/error.log  # View error logs
systemctl status nginx
```

#### WebSocket connection issues
Make sure your Nginx config has the WebSocket headers and long timeout settings shown above.

#### Firewall blocking
```bash
ufw status
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
```

#### ContainerConfig KeyError
This happens when updating an existing deployment with new volumes. Use this **complete cleanup**:

```bash
# Force stop containers
docker stop puggle-game 2>/dev/null || true

# Force remove containers
docker rm -f puggle-game 2>/dev/null || true

# Remove all puggle-related images
docker rmi -f $(docker images | grep -E 'puggle|chinniproject' | awk '{print $3}') 2>/dev/null || true

# Remove volume
docker volume rm chinniproject_ratings-data 2>/dev/null || true

# Clean up system
docker system prune -f

# Rebuild from scratch
docker-compose build --no-cache --pull

# Start fresh
docker-compose up -d

# Verify
docker-compose ps
docker-compose logs -f
```

#### Reset everything (nuclear option)
```bash
cd /var/www/puggle
docker-compose down
docker system prune -a  # CAREFUL: removes all unused Docker images!
git pull origin main
docker-compose up -d --build
```

---

## Performance Optimization (Optional)

### Enable Nginx caching
Add to your Nginx location block:
```nginx
location ~* \.(css|js|jpg|png|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Enable gzip compression
Add to Nginx server block:
```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

---

## Security Recommendations

1. **Create a non-root user:**
   ```bash
   adduser puggleuser
   usermod -aG sudo puggleuser
   ```

2. **Disable root SSH login:**
   ```bash
   nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   systemctl restart sshd
   ```

3. **Install fail2ban:**
   ```bash
   apt install -y fail2ban
   systemctl enable fail2ban
   ```

4. **Keep system updated:**
   ```bash
   apt update && apt upgrade -y
   ```

---

## 📦 Method 2: Manual Deployment (Alternative)

If you prefer not to use Docker, here's how to deploy manually with Node.js and PM2.

<details>
<summary>Click to expand manual deployment instructions</summary>

### Prerequisites
- Node.js 18+ installed
- Git installed

### Steps

1. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt install -y nodejs
   ```

2. **Clone and setup**
   ```bash
   mkdir -p /var/www && cd /var/www
   git clone https://github.com/keerthanpg/scrabble.git puggle
   cd puggle
   npm install
   ```

3. **Install PM2**
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name puggle
   pm2 save
   pm2 startup systemd  # Run the command it outputs!
   ```

4. **Configure Nginx** (same as Docker method above)

5. **Update your app**
   ```bash
   cd /var/www/puggle
   git pull origin main
   npm install
   pm2 restart puggle
   ```

### PM2 Commands
```bash
pm2 status              # Check status
pm2 logs puggle         # View logs
pm2 restart puggle      # Restart
pm2 stop puggle         # Stop
pm2 delete puggle       # Remove
```

</details>

---

## Support

- GitHub Repository: https://github.com/keerthanpg/scrabble
- GitHub Issues: https://github.com/keerthanpg/scrabble/issues
- Check Docker logs: `docker-compose logs -f`
- Check Nginx logs: `tail -f /var/log/nginx/error.log`

---

🐶 Happy deploying! Your Puggle game will be live soon! 🐾
