# Generate secure secrets

```sh
POSTGRES_PASSWORD=$(openssl rand -base64 32)
RABBITMQ_DEFAULT_PASS=$(openssl rand -base64 24)
SECRET_KEY=$(openssl rand -base64 48)
```

please can you please go through my code and make sure we have logs that are       
   store in the db on every action made by an authentictaed user or not ? i want      
   to be able to know that this user/ip access this route at this time and did x.     
   i want that in all the apps 