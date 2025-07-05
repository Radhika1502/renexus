# PostgreSQL Setup Guide for Renexus

## 🚀 **Quick Setup for Windows**

### Option 1: PostgreSQL Installer (Recommended)

1. **Download PostgreSQL**
   - Go to https://www.postgresql.org/download/windows/
   - Download the installer for Windows x86-64
   - Current version: PostgreSQL 16.x

2. **Install PostgreSQL**
   - Run the installer as Administrator
   - **Important**: Set password to `root` (as configured in our app)
   - Default port: 5432
   - Accept all default settings

3. **Verify Installation**
   ```powershell
   # Check if PostgreSQL is running
   Get-Service -Name postgresql*
   
   # Test connection
   psql -U postgres -h localhost -p 5432
   ```

### Option 2: Docker (Alternative)

```powershell
# Pull PostgreSQL image
docker pull postgres:16

# Run PostgreSQL container
docker run --name renexus-postgres -e POSTGRES_PASSWORD=root -p 5432:5432 -d postgres:16

# Verify container is running
docker ps
```

## 🗄️ **Database Setup**

### 1. Create Database

```powershell
# Connect to PostgreSQL
psql -U postgres -h localhost -p 5432

# Create database
CREATE DATABASE renexus;

# Verify database
\l

# Exit psql
\q
```

### 2. Configure Prisma

The database connection is already configured in `backend/api-gateway/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = "postgresql://postgres:root@localhost:5432/renexus"
}
```

### 3. Initialize Database Schema

```powershell
# Navigate to backend directory
cd backend/api-gateway

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with sample data
npx prisma db seed
```

## 🎯 **Running with Real-Time Data**

### 1. Start Backend with PostgreSQL

```powershell
# Navigate to backend directory
cd backend/api-gateway

# Start the real server (with PostgreSQL)
node real-server.js
```

### 2. Start Frontend

```powershell
# Navigate to frontend directory
cd frontend/web

# Start frontend development server
npm run dev
```

### 3. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🔧 **Database Management**

### View Database Schema

```powershell
# Open Prisma Studio (Database GUI)
npx prisma studio
```

### Reset Database

```powershell
# Reset database and reseed
npx prisma db push --force-reset
npx prisma db seed
```

### Backup Database

```powershell
# Create backup
pg_dump -U postgres -h localhost -p 5432 renexus > renexus_backup.sql

# Restore from backup
psql -U postgres -h localhost -p 5432 renexus < renexus_backup.sql
```

## 🚨 **Troubleshooting**

### Connection Issues

1. **Check PostgreSQL Service**
   ```powershell
   # Check if PostgreSQL is running
   Get-Service -Name postgresql*
   
   # Start service if stopped
   Start-Service -Name postgresql*
   ```

2. **Test Connection**
   ```powershell
   # Test database connection
   psql -U postgres -h localhost -p 5432 -d renexus
   ```

3. **Check Firewall**
   - Ensure port 5432 is open
   - Add PostgreSQL to Windows Firewall exceptions

### Authentication Issues

1. **Reset Password**
   ```powershell
   # Connect as postgres user
   psql -U postgres
   
   # Change password
   ALTER USER postgres PASSWORD 'root';
   ```

2. **Check pg_hba.conf**
   - Location: `C:\Program Files\PostgreSQL\16\data\pg_hba.conf`
   - Ensure local connections are allowed

### Performance Issues

1. **Check Database Size**
   ```sql
   SELECT pg_size_pretty(pg_database_size('renexus'));
   ```

2. **Monitor Connections**
   ```sql
   SELECT * FROM pg_stat_activity WHERE datname = 'renexus';
   ```

## 📊 **Database Schema Overview**

The Renexus database includes:

- **Users**: User accounts and profiles
- **Teams**: Team organization and membership
- **Projects**: Project management and tracking
- **Tasks**: Task management with dependencies
- **TimeLog**: Time tracking for tasks
- **TaskTemplate**: Reusable task templates
- **TaskAttachment**: File attachments for tasks

## 🔄 **Development Workflow**

1. **Schema Changes**
   ```powershell
   # Modify schema.prisma
   # Push changes to database
   npx prisma db push
   
   # Generate new client
   npx prisma generate
   ```

2. **Data Seeding**
   ```powershell
   # Run seed script
   npx prisma db seed
   ```

3. **Testing**
   ```powershell
   # Run database tests
   npm test
   ```

## 🌟 **Production Deployment**

For production deployment:

1. **Use Environment Variables**
   ```env
   DATABASE_URL="postgresql://username:password@host:port/database"
   ```

2. **Run Migrations**
   ```powershell
   npx prisma migrate deploy
   ```

3. **Backup Strategy**
   - Schedule regular backups
   - Test restore procedures
   - Monitor database performance

---

**Your Renexus application is now ready to use real-time PostgreSQL data!** 🎉 