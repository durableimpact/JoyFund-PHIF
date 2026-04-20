# Generate secure secrets

```sh
POSTGRES_PASSWORD=$(openssl rand -base64 32)
RABBITMQ_DEFAULT_PASS=$(openssl rand -base64 24)
SECRET_KEY=$(openssl rand -base64 48)
```