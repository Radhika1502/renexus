# Database Setup Guide for Renexus

This guide provides instructions for setting up PostgreSQL and Redis for the Renexus application.

## PostgreSQL Setup

### Windows Installation
1. Download PostgreSQL from the [official website](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the installation wizard
3. Set the password for the postgres user to "postgres" (for development only)
4. Keep the default port (5432)
5. After installation, create a new database called "renexus":
   ```
   psql -U postgres
   CREATE DATABASE renexus;
   \q
   ```

### Configuration
Ensure your PostgreSQL server is configured with the following settings:
- Host: localhost
- Port: 5432
- Username: postgres
- Password: postgres
- Database: renexus

## Redis Setup

### Windows Installation
1. Download the Redis Windows port from [GitHub](https://github.com/microsoftarchive/redis/releases)
2. Run the installer and follow the installation wizard
3. Keep the default port (6379)
4. Ensure the Redis service is running

### Configuration
Ensure your Redis server is configured with the following settings:
- Host: localhost
- Port: 6379
- No password (for development only)

## Verifying the Setup

To verify that your database setup is working correctly:

1. For PostgreSQL:
   ```
   psql -U postgres -d renexus -c "SELECT 'Connection successful';"
   ```

2. For Redis:
   ```
   redis-cli ping
   ```
   Should return "PONG"

## Environment Configuration

Update your `.env` file in the auth-service directory with the following database connection strings:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/renexus
REDIS_URL=redis://localhost:6379
```
