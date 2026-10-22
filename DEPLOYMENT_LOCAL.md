# Local Deployment & Restart (Contabo/VPS)

This guide explains how to deploy, restart containers, or reboot the VPS from your local machine without manually logging into the server every time.

## 1) SSH access (prerequisite)
- Get SSH key from your VPS (or generate one locally: ssh-keygen -t ed25519).
- Add public key to ~/.ssh/authorized_keys on the Contabo server.
- Test: ssh user@your-server-ip
- Use key-based auth (recommended). Add to ~/.ssh/config:
  `sshconfig
  Host joyfund
      HostName your-server-ip
      User your-ssh-user
      IdentityFile ~/.ssh/your_key
      Port 22
  `

## 2) Run deploy.sh from local via SSH
The repo's deploy.sh pulls latest code and rebuilds/restarts frontend/backend containers on the server.

From your local machine:
`ash
ssh joyfund "cd /path/to/JoyFund-PHIF && bash deploy.sh"
`

Or create a local script deploy-local.sh:
`ash
#!/bin/bash
ssh joyfund "cd /opt/JoyFund-PHIF && git fetch origin && git reset --hard origin/main && bash deploy.sh"
`

## 3) Restart containers directly without full deploy
`ash
ssh joyfund "cd /path/to/JoyFund-PHIF && docker compose -f backend/prod.yml --env-file ./backend/envs/prod/.env restart"
ssh joyfund "cd /path/to/JoyFund-PHIF && docker compose --env-file frontend/.env -f frontend/docker-compose.yml restart"
`

## 4) Remote Docker API
`ash
export DOCKER_HOST=ssh://joyfund
docker ps
`

## 5) Reboot the VPS
`ash
ssh joyfund "sudo reboot"
`

## Tips
- Use SSH keys to avoid passwords.
- Keep env files secure and never commit them.
- Ensure SSH user has permission to access Docker (sudo usermod -aG docker  on server).
