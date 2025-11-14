# Supabase Jumphost Scripts

Helper scripts for connecting to Supabase PostgreSQL database through an IPv6-capable jumphost.

## Quick Start

**1. Set up your cloud jumphost:**
```bash
# SSH into your cloud VM (DigitalOcean, AWS, Hetzner, etc.)
ssh user@your-jumphost-ip

# Run the setup script
./setup-jumphost.sh
```

**2. Start the SSH tunnel from your local machine:**
```bash
# Configure environment
export JUMPHOST_IP="your.jumphost.ip.address"
export SUPABASE_HOST="db.yourproject.supabase.co"

# Start tunnel
./tunnel-local.sh
```

**3. Test the connection:**
```bash
./test-connection.sh
```

## Files

- **`setup-jumphost.sh`** - Run this on your cloud VM to configure it as a jumphost
- **`tunnel-local.sh`** - Run this on your local machine to create the SSH tunnel
- **`test-connection.sh`** - Test your database connection through the tunnel
- **`supabase-tunnel.service`** - systemd service file for persistent tunnel (optional)

## Documentation

See [docs/SUPABASE_JUMPHOST_SETUP.md](../../docs/SUPABASE_JUMPHOST_SETUP.md) for complete setup instructions.

## Common Commands

```bash
# Start tunnel manually
ssh -N -L 5432:db.yourproject.supabase.co:5432 user@jumphost-ip

# Check if tunnel is running
lsof -i :5432

# Test database connection
psql "postgresql://postgres:password@localhost:5432/postgres"

# Set up systemd service (auto-restart)
sudo cp supabase-tunnel.service /etc/systemd/system/supabase-tunnel@.service
sudo systemctl enable supabase-tunnel@$USER
sudo systemctl start supabase-tunnel@$USER
```

## Troubleshooting

**Connection refused:**
- Make sure the tunnel is running: `lsof -i :5432`
- Start the tunnel: `./tunnel-local.sh`

**Permission denied:**
- Add SSH key: `ssh-copy-id user@jumphost-ip`
- Or use: `ssh-add ~/.ssh/your-key`

**Port already in use:**
- Kill old tunnel: `kill $(lsof -t -i:5432)`
- Or use different port: `ssh -N -L 15432:...`

## Requirements

- Cloud VM with IPv6 support (DigitalOcean, AWS, Hetzner, etc.)
- SSH client on your local machine
- Supabase project with PostgreSQL database
