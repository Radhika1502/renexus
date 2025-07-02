# Renexus Database Schema & Migration

This directory contains the unified database schema and migration utilities for the Renexus platform, integrating features from both Renexus_Replit and project-bolt codebases.

## Directory Structure

```
database/
├── schema/
│   ├── unified_schema.ts    # Unified Drizzle ORM schema definition
│   └── schema_analysis.md   # Analysis of source schemas and migration strategy
├── migrations/
│   ├── migration.ts         # Migration script for schema and data migration
│   └── sql/                 # Generated SQL migration files
└── README.md                # This file
```

## Schema Overview

The unified schema is designed with the following principles:

1. **Multi-tenancy Support**: All entities are associated with a tenant for proper data isolation
2. **Comprehensive Entity Relationships**: Proper references between related entities
3. **Enhanced Data Types**: Using appropriate PostgreSQL types including JSONB for flexible data
4. **Validation**: Zod schemas for runtime validation

Key entities in the schema:

- **Core**: tenants, users, tenantUsers
- **Teams**: teams, teamMembers
- **Projects**: projects, projectMembers, versions, portfolios
- **Agile**: epics, userStories, sprints, tasks, bugs
- **Collaboration**: comments, files, timeEntries, activities
- **Communication**: communicationChannels, chatMessages, videoMeetings
- **AI Features**: aiSuggestions, aiInsights
- **Workflow**: workflows, risks, notifications

## Migration Process

The migration process involves:

1. **Schema Migration**: Creating the new database tables
2. **Data Migration**: Transferring data from existing schemas
3. **Validation**: Ensuring data integrity after migration

### Running Migrations

```bash
# Install dependencies
npm install

# Generate migration files
npm run migration:generate

# Run schema migrations
npm run migration:run

# Migrate data from existing schemas
npm run migration:data

# Validate migration results
npm run migration:validate

# Or run the complete process
npm run migration:full
```

### Environment Variables

Create a `.env` file with the following variables:

```
DATABASE_URL=postgresql://user:password@localhost:5432/renexus
RENEXUS_REPLIT_DB_URL=postgresql://user:password@localhost:5432/renexus_replit
PROJECT_BOLT_DB_URL=postgresql://user:password@localhost:5432/project_bolt
```

## Development

To extend the schema:

1. Update `unified_schema.ts` with new tables or fields
2. Generate a new migration: `npm run migration:generate -- name_of_migration`
3. Apply the migration: `npm run migration:run`

## Backup and Recovery

Before running migrations in production:

1. Create a full database backup
2. Test the migration process in a staging environment
3. Have a rollback plan ready

## Notes

- The schema is designed to be extensible for future requirements
- Custom fields are supported via JSONB columns
- All tables include audit fields (createdAt, updatedAt)
