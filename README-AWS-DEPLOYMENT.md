# AWS Deployment Guide (Bare EC2)

The site runs on a single bare EC2 instance (no Elastic Beanstalk, no load balancer) fronted by Cloudflare for TLS. This keeps monthly cost down to roughly the price of the instance + disk + Elastic IP, with no ALB tax.

## Current infrastructure

| Resource | Value |
|---|---|
| Region | us-east-1 |
| Instance | `i-08c3a53cc9a59de54` (t3.micro, Amazon Linux 2023) |
| Elastic IP | `35.169.223.170` |
| Security group | `sg-00864c90d5fe870f4` (SSH restricted to admin IP; 80/443 open to all) |
| SSH key | `~/.ssh/usabo-ec2-key.pem` |
| Domain | `usabos.org` / `www.usabos.org` via Cloudflare (proxied, SSL mode: Flexible) |
| Process manager | pm2, process name `usabo-website`, auto-restarts on crash/reboot via systemd |
| Reverse proxy | nginx, `/etc/nginx/conf.d/usabo.conf`, proxies port 80 → `localhost:3002` |
| App code | `/home/ec2-user/app` on the instance, deployed from the `main` branch |

## Architecture

```
Browser --HTTPS--> Cloudflare (proxy, terminates TLS) --HTTP:80--> nginx --> Node app on :3002 (pm2)
```

Cloudflare is in "Flexible" SSL mode: it terminates HTTPS for visitors but talks to the origin over plain HTTP. There is no cert installed on the box itself.

## Connecting to the server

```bash
ssh -i ~/.ssh/usabo-ec2-key.pem ec2-user@35.169.223.170
```

If your home/office IP changes, SSH will stop working until the security group's port-22 rule is updated:

```bash
aws ec2 authorize-security-group-ingress --group-id sg-00864c90d5fe870f4 --protocol tcp --port 22 --cidr <your-new-ip>/32 --region us-east-1
aws ec2 revoke-security-group-ingress --group-id sg-00864c90d5fe870f4 --protocol tcp --port 22 --cidr <old-ip>/32 --region us-east-1
```

## Deploying updates

```bash
ssh -i ~/.ssh/usabo-ec2-key.pem ec2-user@35.169.223.170
cd app
git pull
npm install --omit=dev
pm2 restart usabo-website
```

## Environment variables

Production secrets live in `/home/ec2-user/app/.env` on the instance only (never committed). It's based on `.env.example` with these production-specific overrides:
- `NODE_ENV=production`
- `APP_URL=https://usabos.org`
- `GOOGLE_CALLBACK_URL` / `GITHUB_CALLBACK_URL` pointed at `usabos.org` instead of localhost

To change a value, edit the file directly on the box, then `pm2 restart usabo-website`:

```bash
ssh -i ~/.ssh/usabo-ec2-key.pem ec2-user@35.169.223.170
nano app/.env
pm2 restart usabo-website
```

## Logs & health checks

```bash
pm2 logs usabo-website          # tail app logs
pm2 status                      # process status
sudo systemctl status nginx     # reverse proxy status
sudo nginx -t                   # validate nginx config after edits
```

## DNS (Cloudflare)

`usabos.org` and `www.usabos.org` are both **A records** pointing to `35.169.223.170`, proxy status **on** (orange cloud). SSL/TLS mode is **Flexible**. If either record ever gets reset to a CNAME (e.g. from an old provider migration), recreate it as a plain A record — Cloudflare can't proxy a CNAME to a dead hostname.

## Rebuilding from scratch

If the instance is ever terminated and needs to be recreated:

1. Launch a t3.micro Amazon Linux 2023 instance in the existing security group (or recreate one allowing 22 from your IP, 80/443 from anywhere).
2. Allocate + associate a new Elastic IP.
3. On first boot: `sudo dnf install -y git nginx gcc-c++ make python3`, install Node 20 via NodeSource, `npm install -g pm2`.
4. `git clone --branch main https://github.com/shangjieteng-sketch/USABO-website.git app`
5. Copy over the production `.env` (from backup or recreate from `.env.example`), `npm install --omit=dev`, `pm2 start server.js --name usabo-website`, `pm2 save`, `pm2 startup systemd -u ec2-user --hp /home/ec2-user`.
6. Drop in the nginx reverse-proxy config (`server_name usabos.org www.usabos.org`; `proxy_pass http://127.0.0.1:3002`), `sudo nginx -t && sudo systemctl restart nginx`.
7. Update the Elastic IP in Cloudflare's A records if it changed.

## Cost estimate

- t3.micro: free tier eligible (750 hrs/mo for 12 months from account creation), otherwise ~$7.50/mo
- 20GB gp3 EBS volume: ~$1.60/mo
- Elastic IP: ~$3.60/mo (AWS charges for all public IPv4 addresses regardless of attachment)
- **Total: ~$0-13/mo** depending on free-tier status, with no load-balancer surcharge.
