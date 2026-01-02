# 🐶 Puggle Deployment Guide - Digital Ocean

Complete guide to deploy your pug-themed Puggle game on a Digital Ocean droplet.

## Prerequisites

- Digital Ocean droplet (Ubuntu 20.04 or 22.04 recommended)
- SSH access to your droplet
- Domain name (optional, but recommended for SSL)

---

## Step 1: Initial Server Setup

SSH into your droplet:
```bash
ssh root@your_droplet_ip
```

Update system packages:
```bash
apt update && apt upgrade -y
```

---

## Step 2: Install Node.js

Install Node.js (v18 LTS recommended):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
```

Verify installation:
```bash
node --version
npm --version
```

---

## Step 3: Install Git

```bash
apt install -y git
```

---

## Step 4: Clone Your Repository

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

## Step 5: Install Dependencies

```bash
npm install
```

---

## Step 6: Configure Firewall

Allow SSH, HTTP, and HTTPS:
```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw enable
```

Check firewall status:
```bash
ufw status
```

---

## Step 7: Test the Application

Test run to make sure everything works:
```bash
npm start
```

Visit `http://your_droplet_ip:3000` in your browser.

Press `Ctrl+C` to stop the test run.

---

## Step 8: Install PM2 (Process Manager)

Install PM2 globally:
```bash
npm install -g pm2
```

Start the application with PM2:
```bash
pm2 start server/index.js --name puggle
```

Save PM2 configuration:
```bash
pm2 save
```

Setup PM2 to start on boot:
```bash
pm2 startup systemd
```

**Copy and run the command that PM2 outputs!**

Useful PM2 commands:
```bash
pm2 status              # Check app status
pm2 logs puggle         # View logs
pm2 restart puggle      # Restart app
pm2 stop puggle         # Stop app
pm2 delete puggle       # Remove from PM2
```

---

## Step 9: Install and Configure Nginx (Reverse Proxy)

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

## Step 10: Setup SSL with Let's Encrypt (Optional but Recommended)

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

## Step 11: Update Your Application

To deploy updates in the future:

```bash
cd /var/www/puggle
git pull origin main
npm install  # If dependencies changed
pm2 restart puggle
```

---

## Quick Reference Commands

```bash
# Check app status
pm2 status

# View logs
pm2 logs puggle

# Restart app
pm2 restart puggle

# Check Nginx status
systemctl status nginx

# Restart Nginx
systemctl restart nginx

# Check firewall
ufw status

# Monitor server resources
htop
```

---

## Troubleshooting

### App not starting
```bash
pm2 logs puggle  # Check error logs
pm2 restart puggle
```

### Port 3000 already in use
```bash
lsof -i :3000
kill -9 <PID>
pm2 restart puggle
```

### Nginx errors
```bash
nginx -t  # Test configuration
tail -f /var/log/nginx/error.log  # View error logs
```

### WebSocket connection issues
Make sure your Nginx config has the WebSocket headers and long timeout settings shown above.

### Firewall blocking
```bash
ufw status
ufw allow 80/tcp
ufw allow 443/tcp
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

## Support

- GitHub Issues: https://github.com/keerthanpg/scrabble/issues
- Check PM2 logs: `pm2 logs puggle`
- Check Nginx logs: `tail -f /var/log/nginx/error.log`

---

🐶 Happy deploying! Your Puggle game will be live soon! 🐾
