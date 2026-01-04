# GitHub Secrets Setup for Auto-Deploy

To enable automatic deployment, you need to configure these secrets in your GitHub repository:

## Required Secrets

Go to: **Repository Settings → Secrets and variables → Actions → New repository secret**

### 1. DROPLET_HOST
- **Value**: Your droplet's IP address or domain
- **Example**: `147.182.123.45` or `scrabble.yourdomain.com`

### 2. DROPLET_USER
- **Value**: SSH username for your droplet
- **Example**: `root` or your custom user

### 3. DROPLET_SSH_KEY
- **Value**: Your SSH private key for the droplet
- **How to get it**:
  ```bash
  # On your local machine, display your private key:
  cat ~/.ssh/id_rsa

  # Or if you use a different key:
  cat ~/.ssh/your_key_name
  ```
- **Copy the entire output** including the lines:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  ...your key content...
  -----END OPENSSH PRIVATE KEY-----
  ```

## Setup Steps

1. **Add SSH Key to Droplet** (if not already done):
   ```bash
   # On your local machine:
   ssh-copy-id root@your_droplet_ip

   # Or manually:
   cat ~/.ssh/id_rsa.pub | ssh root@your_droplet_ip "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
   ```

2. **Add Secrets to GitHub**:
   - Go to your repo: https://github.com/keerthanpg/scrabble/settings/secrets/actions
   - Click "New repository secret"
   - Add each of the 3 secrets above

3. **Test the Workflow**:
   - Go to: https://github.com/keerthanpg/scrabble/actions
   - Click on "Deploy to Droplet"
   - Click "Run workflow" → "Run workflow" button
   - Watch it deploy!

## How It Works

- **Automatic**: Every push to `main` branch triggers deployment
- **Manual**: You can also trigger deployment from the Actions tab
- **Process**:
  1. SSH into your droplet
  2. Navigate to `~/scrabble`
  3. Pull latest code from `main`
  4. Rebuild and restart Docker containers
  5. Show container status

## Troubleshooting

### SSH Connection Failed
- Verify `DROPLET_HOST` is correct
- Ensure SSH key is properly formatted (with BEGIN/END lines)
- Check that the key is authorized on the droplet

### Git Pull Failed
- Ensure the repo is cloned at `~/scrabble` on droplet
- Check that git remote is set correctly

### Docker Build Failed
- SSH into droplet and check logs: `cd ~/scrabble && docker-compose logs`
- Verify `~/scrabble_prod_data` folder exists

## Security Notes

- Never commit your private SSH key to the repository
- Use GitHub Secrets to store sensitive credentials
- Consider creating a dedicated deploy user with limited permissions
- Regularly rotate SSH keys
