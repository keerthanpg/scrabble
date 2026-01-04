#!/bin/bash
# Setup SSL certificates for Puggle with Docker

set -e

echo "🔒 Puggle SSL Setup"
echo "==================="
echo ""

# Check if domain is provided
if [ -z "$1" ]; then
    echo "Usage: ./setup-ssl.sh your-domain.com your-email@example.com"
    echo ""
    echo "Example: ./setup-ssl.sh scrabble.keerthanapg.com admin@keerthanapg.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-""}

if [ -z "$EMAIL" ]; then
    echo "⚠️  Warning: No email provided. Let's Encrypt recommends providing an email."
    read -p "Enter your email (or press Enter to skip): " EMAIL
fi

echo ""
echo "Domain: $DOMAIN"
echo "Email: ${EMAIL:-"(none)"}"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""
echo "Step 1: Creating SSL directory..."
mkdir -p nginx/ssl
mkdir -p nginx/certbot

echo "Step 2: Updating Nginx config for $DOMAIN..."
sed "s/DOMAIN_NAME/$DOMAIN/g" nginx/nginx-ssl.conf.template > nginx/nginx.conf

echo "Step 3: Installing certbot..."
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt update
    apt install -y certbot
else
    echo "Certbot already installed ✓"
fi

echo "Step 4: Stopping containers if running..."
docker-compose down 2>/dev/null || true

echo "Step 5: Starting containers..."
docker-compose up -d

echo "Step 6: Waiting for Nginx to start..."
sleep 5

echo "Step 7: Obtaining SSL certificate..."
if [ -z "$EMAIL" ]; then
    certbot certonly --webroot \
        --webroot-path=./nginx/certbot \
        -d $DOMAIN \
        --register-unsafely-without-email \
        --agree-tos \
        --non-interactive
else
    certbot certonly --webroot \
        --webroot-path=./nginx/certbot \
        -d $DOMAIN \
        --email $EMAIL \
        --agree-tos \
        --non-interactive
fi

echo "Step 8: Copying certificates to Docker volume..."
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/

echo "Step 9: Restarting containers with SSL..."
docker-compose restart nginx

echo ""
echo "✅ SSL Setup Complete!"
echo ""
echo "Your site is now available at:"
echo "https://$DOMAIN"
echo ""
echo "Certificate auto-renewal is configured."
echo ""

# Add renewal cron job
if ! crontab -l | grep -q "certbot renew"; then
    echo "Step 10: Setting up auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --post-hook 'cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $(pwd)/nginx/ssl/ && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $(pwd)/nginx/ssl/ && docker-compose restart nginx' >> /var/log/certbot-renew.log 2>&1") | crontab -
    echo "Auto-renewal configured ✓"
fi

echo ""
echo "🐶 Puggle is ready with HTTPS!"
