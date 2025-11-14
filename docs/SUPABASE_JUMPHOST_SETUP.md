# Supabase IPv6 Jumphost Setup Guide

This guide provides **exact commands** for setting up a cloud VM jumphost to connect to your Supabase PostgreSQL database when your local network doesn't support IPv6.

## Overview

Supabase databases require IPv6 connectivity. If your local network only supports IPv4, you need an intermediary server (jumphost) with IPv6 support to create an SSH tunnel.

**Architecture:**
```
Your Local Machine (IPv4)
    ↓ SSH Tunnel (IPv4)
Cloud VM Jumphost (IPv4 + IPv6)
    ↓ PostgreSQL Connection (IPv6)
Supabase Database (IPv6)
```

## Prerequisites

- [ ] Supabase project with PostgreSQL database
- [ ] Cloud VM with IPv6 support (e.g., DigitalOcean, AWS EC2, Google Cloud, Hetzner)
- [ ] SSH key pair for authentication
- [ ] Local machine with SSH client

## Step 1: Create Cloud VM (Jumphost)

Choose a cloud provider that supports IPv6. Here are exact commands for popular providers:

### Option A: DigitalOcean

```bash
# Install doctl CLI
brew install doctl  # macOS
# or
wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz
tar xf doctl-*.tar.gz
sudo mv doctl /usr/local/bin

# Authenticate
doctl auth init

# Create droplet with IPv6
doctl compute droplet create supabase-jumphost \
    --region nyc3 \
    --size s-1vcpu-1gb \
    --image ubuntu-22-04-x64 \
    --enable-ipv6 \
    --ssh-keys $(doctl compute ssh-key list --format ID --no-header)

# Get the IPv4 address
doctl compute droplet list supabase-jumphost --format PublicIPv4
```

### Option B: AWS EC2

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS
aws configure

# Create security group
aws ec2 create-security-group \
    --group-name supabase-jumphost-sg \
    --description "Security group for Supabase jumphost"

# Allow SSH
aws ec2 authorize-security-group-ingress \
    --group-name supabase-jumphost-sg \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0

# Launch EC2 instance with IPv6
aws ec2 run-instances \
    --image-id ami-0c55b159cbfafe1f0 \
    --count 1 \
    --instance-type t2.micro \
    --key-name your-key-name \
    --security-groups supabase-jumphost-sg \
    --ipv6-address-count 1

# Get instance public IP
aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=supabase-jumphost" \
    --query 'Reservations[*].Instances[*].PublicIpAddress' \
    --output text
```

### Option C: Google Cloud Platform

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Create instance with IPv6
gcloud compute instances create supabase-jumphost \
    --zone=us-east1-b \
    --machine-type=e2-micro \
    --network-tier=PREMIUM \
    --stack-type=IPV4_IPV6 \
    --ipv6-network-tier=PREMIUM \
    --image=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud

# Get instance IP
gcloud compute instances describe supabase-jumphost \
    --zone=us-east1-b \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

### Option D: Hetzner Cloud (Cheapest Option)

```bash
# Install hcloud CLI
brew install hcloud  # macOS
# or
wget https://github.com/hetznercloud/cli/releases/download/v1.35.0/hcloud-linux-amd64.tar.gz
tar xf hcloud-*.tar.gz
sudo mv hcloud /usr/local/bin

# Authenticate
hcloud context create supabase-jumphost

# Create server with IPv6
hcloud server create \
    --name supabase-jumphost \
    --type cx11 \
    --image ubuntu-22.04 \
    --ssh-key your-key-name \
    --enable-ipv6

# Get server IP
hcloud server ip supabase-jumphost
```

## Step 2: Set Up SSH Keys

If you don't have an SSH key pair:

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "supabase-jumphost" -f ~/.ssh/supabase_jumphost

# Copy public key to jumphost
ssh-copy-id -i ~/.ssh/supabase_jumphost.pub user@JUMPHOST_IP

# Test SSH connection
ssh -i ~/.ssh/supabase_jumphost user@JUMPHOST_IP
```

## Step 3: Configure Jumphost Server

SSH into your jumphost and run the setup script:

```bash
# SSH into jumphost
ssh user@JUMPHOST_IP

# Download setup script
curl -O https://raw.githubusercontent.com/yourusername/NaviKid-v1/main/scripts/jumphost/setup-jumphost.sh

# Make executable
chmod +x setup-jumphost.sh

# Run setup
./setup-jumphost.sh
```

Or manually execute:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y openssh-server postgresql-client curl

# Configure SSH keepalive
echo "TCPKeepAlive yes" | sudo tee -a /etc/ssh/sshd_config
echo "ClientAliveInterval 60" | sudo tee -a /etc/ssh/sshd_config
echo "ClientAliveCountMax 3" | sudo tee -a /etc/ssh/sshd_config
echo "GatewayPorts yes" | sudo tee -a /etc/ssh/sshd_config

# Restart SSH
sudo systemctl restart sshd

# Enable IPv6
sudo sysctl -w net.ipv6.conf.all.disable_ipv6=0
sudo sysctl -w net.ipv6.conf.default.disable_ipv6=0

# Test IPv6
ping6 -c 3 google.com
```

### Verify Supabase Connectivity from Jumphost

```bash
# Get Supabase connection details from your Supabase dashboard
# Settings > Database > Connection string (Direct connection)

# Test connection
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Should connect successfully and show:
# postgres=>
```

## Step 4: Create SSH Tunnel from Local Machine

### Method A: Manual Tunnel (Quick Test)

```bash
# On your LOCAL machine
export JUMPHOST_IP="your-jumphost-ip"
export SUPABASE_HOST="db.yourproject.supabase.co"

# Start tunnel
ssh -N -L 5432:$SUPABASE_HOST:5432 user@$JUMPHOST_IP

# In another terminal, test connection
psql "postgresql://postgres:[YOUR-PASSWORD]@localhost:5432/postgres"
```

### Method B: Using Helper Script (Recommended)

```bash
# On your LOCAL machine
cd /path/to/NaviKid-v1

# Make script executable
chmod +x scripts/jumphost/tunnel-local.sh

# Configure environment
export JUMPHOST_IP="your.jumphost.ip"
export JUMPHOST_USER="ubuntu"
export SUPABASE_HOST="db.yourproject.supabase.co"

# Start tunnel
./scripts/jumphost/tunnel-local.sh
```

### Method C: Systemd Service (Auto-restart)

For a production setup that automatically restarts on failure:

```bash
# On your LOCAL machine

# 1. Copy the service file
sudo cp scripts/jumphost/supabase-tunnel.service /etc/systemd/system/supabase-tunnel@.service

# 2. Edit the service file with your configuration
sudo nano /etc/systemd/system/supabase-tunnel@.service

# Update these lines:
#   Environment="JUMPHOST_IP=your.jumphost.ip"
#   Environment="SUPABASE_HOST=db.yourproject.supabase.co"

# 3. Ensure SSH key is in place
cp ~/.ssh/supabase_jumphost ~/.ssh/id_ed25519
# OR update the service file to point to your key

# 4. Enable and start the service (replace USERNAME with your user)
sudo systemctl enable supabase-tunnel@$USER
sudo systemctl start supabase-tunnel@$USER

# 5. Check status
sudo systemctl status supabase-tunnel@$USER

# 6. View logs
sudo journalctl -u supabase-tunnel@$USER -f
```

## Step 5: Update Application Configuration

Update your `.env` file to use the tunnel:

```bash
# Before (won't work without IPv6):
# DB_HOST=db.yourproject.supabase.co
# DB_PORT=5432

# After (uses tunnel):
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-supabase-password
DB_NAME=postgres
DB_SSL=true
```

Or use a full connection string:

```bash
DATABASE_URL="postgresql://postgres:your-password@localhost:5432/postgres?sslmode=require"
```

## Step 6: Test Backend Connection

```bash
# In the NaviKid-v1 directory
cd backend

# Copy environment variables
cp .env.example .env

# Edit with tunnel configuration
nano .env

# Test connection
npm run scripts/test-backend-connection.ts
```

Or manually test:

```bash
# Install psql if not already installed
# Ubuntu/Debian:
sudo apt install postgresql-client

# macOS:
brew install postgresql

# Test connection through tunnel
psql "postgresql://postgres:[YOUR-PASSWORD]@localhost:5432/postgres"
```

## Troubleshooting

### Issue: "Connection refused" on port 5432

**Solution:**
```bash
# Check if tunnel is running
lsof -i :5432

# If nothing is listening, start the tunnel
./scripts/jumphost/tunnel-local.sh
```

### Issue: "Permission denied (publickey)"

**Solution:**
```bash
# Ensure SSH key is added to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/supabase_jumphost

# Or specify key explicitly
ssh -i ~/.ssh/supabase_jumphost user@JUMPHOST_IP
```

### Issue: Tunnel keeps disconnecting

**Solution:**
```bash
# Use the systemd service for auto-restart
sudo systemctl enable supabase-tunnel@$USER
sudo systemctl start supabase-tunnel@$USER

# Or use autossh for automatic reconnection
sudo apt install autossh

autossh -M 0 -N \
    -L 5432:$SUPABASE_HOST:5432 \
    -o "ServerAliveInterval=60" \
    -o "ServerAliveCountMax=3" \
    user@$JUMPHOST_IP
```

### Issue: IPv6 not working on jumphost

**Solution:**
```bash
# On jumphost, enable IPv6
sudo sysctl -w net.ipv6.conf.all.disable_ipv6=0
sudo sysctl -w net.ipv6.conf.default.disable_ipv6=0

# Test IPv6 connectivity
ping6 google.com

# Check network interfaces
ip -6 addr show

# Restart networking
sudo systemctl restart networking
```

### Issue: Port 5432 already in use

**Solution:**
```bash
# Find what's using the port
lsof -i :5432

# Kill the process (if it's an old tunnel)
kill $(lsof -t -i:5432)

# Or use a different local port
ssh -N -L 15432:$SUPABASE_HOST:5432 user@$JUMPHOST_IP

# Update your .env
DB_PORT=15432
```

## Security Best Practices

1. **Use SSH keys, not passwords:**
   ```bash
   # Disable password authentication on jumphost
   sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
   sudo systemctl restart sshd
   ```

2. **Restrict SSH access by IP (if you have static IP):**
   ```bash
   # On jumphost
   sudo ufw allow from YOUR_IP_ADDRESS to any port 22
   sudo ufw enable
   ```

3. **Use fail2ban to prevent brute force:**
   ```bash
   # On jumphost
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

4. **Rotate Supabase password regularly:**
   - Go to Supabase Dashboard > Settings > Database
   - Generate new password
   - Update your local `.env` file

## Cost Estimates

**Monthly costs for smallest jumphost:**
- DigitalOcean: $6/month (1GB RAM, 1 vCPU)
- AWS EC2 t2.micro: ~$8.50/month (free tier eligible for 12 months)
- Google Cloud e2-micro: ~$7.50/month (free tier eligible)
- Hetzner Cloud CX11: €3.79/month (~$4/month) ⭐ **Cheapest**

**Recommendation:** Hetzner Cloud CX11 for cost-effectiveness.

## Quick Reference Commands

```bash
# Start tunnel manually
ssh -N -L 5432:db.yourproject.supabase.co:5432 user@jumphost-ip

# Start tunnel with helper script
JUMPHOST_IP=x.x.x.x SUPABASE_HOST=db.proj.supabase.co ./scripts/jumphost/tunnel-local.sh

# Check tunnel status
lsof -i :5432

# Test database connection
psql "postgresql://postgres:password@localhost:5432/postgres"

# View systemd service logs
sudo journalctl -u supabase-tunnel@$USER -f

# Restart systemd service
sudo systemctl restart supabase-tunnel@$USER
```

## Resources

- [Supabase IPv6 Documentation](https://supabase.com/docs/guides/database/connecting-to-postgres#ipv6)
- [SSH Tunneling Guide](https://www.ssh.com/academy/ssh/tunneling)
- [systemd Service Documentation](https://www.freedesktop.org/software/systemd/man/systemd.service.html)

---

**Last Updated:** 2025-11-14
**Maintainer:** NaviKid DevOps Team
