-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS renexus;

-- Create tables based on schema if they don't exist
-- Projects table
CREATE TABLE IF NOT EXISTS "Project" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "status" VARCHAR(50) NOT NULL,
  "clientId" VARCHAR(255),
  "startDate" TIMESTAMP WITH TIME ZONE,
  "endDate" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS "Task" (
  "id" VARCHAR(255) PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "status" VARCHAR(50) NOT NULL,
  "estimatedHours" DECIMAL,
  "projectId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE
);

-- TimeLogs table
CREATE TABLE IF NOT EXISTS "TimeLog" (
  "id" VARCHAR(255) PRIMARY KEY,
  "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endTime" TIMESTAMP WITH TIME ZONE NOT NULL,
  "duration" DECIMAL NOT NULL,
  "taskId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE
);
