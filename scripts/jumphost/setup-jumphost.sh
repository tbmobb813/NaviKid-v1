#!/bin/bash
# Setup script for Supabase IPv6 jumphost
# Run this script on your cloud VM (jumphost) that has IPv6 connectivity

set -e

echo "🚀 Setting up Supabase IPv6 jumphost..."

# Update system
echo "📦 Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
sudo apt install -y \
    openssh-server \
    postgresql-client \
    curl \
    vim \
    htop

# Configure SSH for better performance
echo "🔧 Configuring SSH server..."
sudo tee -a /etc/ssh/sshd_config > /dev/null <<EOF

# Supabase jumphost optimization
TCPKeepAlive yes
ClientAliveInterval 60
ClientAliveCountMax 3
GatewayPorts yes
EOF

# Restart SSH service
echo "🔄 Restarting SSH service..."
sudo systemctl restart sshd

# Enable IPv6 (if not already enabled)
echo "🌐 Ensuring IPv6 is enabled..."
sudo sysctl -w net.ipv6.conf.all.disable_ipv6=0
sudo sysctl -w net.ipv6.conf.default.disable_ipv6=0

# Make IPv6 setting persistent
echo "net.ipv6.conf.all.disable_ipv6=0" | sudo tee -a /etc/sysctl.conf
echo "net.ipv6.conf.default.disable_ipv6=0" | sudo tee -a /etc/sysctl.conf

# Test IPv6 connectivity
echo "🧪 Testing IPv6 connectivity..."
if ping6 -c 3 google.com > /dev/null 2>&1; then
    echo "✅ IPv6 connectivity confirmed"
else
    echo "⚠️  Warning: IPv6 connectivity test failed"
    echo "   You may need to configure IPv6 with your cloud provider"
fi

# Create a test user for SSH tunneling (optional, for security)
echo "👤 Creating tunnel user (optional)..."
if ! id "tunneluser" &>/dev/null; then
    sudo useradd -m -s /bin/bash tunneluser
    echo "   Created user 'tunneluser'"
    echo "   Add your SSH public key to /home/tunneluser/.ssh/authorized_keys"
fi

echo ""
echo "✅ Jumphost setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your SSH public key to this server:"
echo "   ssh-copy-id user@jumphost-ip"
echo "2. Test Supabase connectivity from this jumphost:"
echo "   psql 'postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres'"
echo "3. Run the local tunnel script on your development machine"
