# SSH tunnel helper & systemd unit

This document explains how to use the included SSH tunnel helper and the example systemd unit to forward a remote IPv6-capable host's connection to the Supabase Postgres instance back to localhost.

Files

- `backend/scripts/start-db-ssh-tunnel.sh` — lightweight helper script to start an SSH local-forward in the background.
- `backend/scripts/ssh-tunnel.service` — example systemd service that reads settings from `/etc/default/ssh-tunnel` and starts a persistent tunnel.

Quick manual workflow (temporary tunnel)

1. Ensure the helper is executable:

```bash
chmod +x backend/scripts/start-db-ssh-tunnel.sh
```

2. Start a tunnel using a remote host you control (remote host must have network connectivity to the Supabase DB):

```bash
./backend/scripts/start-db-ssh-tunnel.sh ubuntu@jumphost 15432 db.feqfhdwmwrolaafchldq.supabase.co 5432
```

3. Point your local DATABASE_URL at the forwarded port and run the diagnostic:

```bash
export DATABASE_URL='postgresql://postgres:<password>@localhost:15432/postgres?sslmode=require'
DB_CA_PATH=backend/supabase-ca.pem node backend/scripts/test-db-conn.js
```

Systemd persistent tunnel (recommended for longer-lived dev setups)

1. Create `/etc/default/ssh-tunnel` with contents like:

```ini
REMOTE_SSH="ubuntu@203.0.113.5"
LOCAL_PORT=15432
REMOTE_DB_HOST=db.feqfhdwmwrolaafchldq.supabase.co
REMOTE_DB_PORT=5432
```

2. Copy the service file to systemd and enable it:

```bash
sudo cp backend/scripts/ssh-tunnel.service /etc/systemd/system/ssh-tunnel.service
sudo systemctl daemon-reload
sudo systemctl enable --now ssh-tunnel.service
sudo systemctl status ssh-tunnel.service
```

3. To stop the tunnel:

```bash
sudo systemctl stop ssh-tunnel.service
```

Security notes

- The remote host must be trusted and accessible via SSH.
- Use SSH keys and `ssh-agent` for non-interactive tunnels. Avoid embedding passwords.
- The forwarded port is bound to 127.0.0.1 by default; do not bind to 0.0.0.0 unless you intentionally want to expose it.

Troubleshooting

- If the tunnel fails to start, check `journalctl -u ssh-tunnel.service -e` for details.
- If the remote host can't resolve the DB host, confirm DNS from the remote host.
