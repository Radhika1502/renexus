# Database Schema Analysis & Planning

## Overview

This document analyzes the database schemas from both `Renexus_Replit` and `project-bolt` codebases to create a unified schema design for the consolidated Renexus application.

## Schema Comparison

| Entity | Renexus_Replit (Drizzle ORM) | project-bolt (TypeScript Interfaces) | Migration Strategy |
|--------|--------------------------|--------------------------------|-------------------|
| **Users** | `users` table with enhanced features | `User` interface | Merge and enhance |
| **Projects** | `projects` table with tenant support | `Project` interface | Merge and enhance |
| **Tasks** | `tasks` table with extensive metadata | `Task` interface | Merge and enhance |
| **Teams** | `teams` table | `Team` interface | Merge and enhance |
| **Comments** | `comments` table | `Comment` interface | Merge and enhance |
| **Epics** | `epics` table | `Epic` interface | Merge and enhance |
| **User Stories** | `userStories` table | `UserStory` interface | Merge and enhance |
| **Sprints** | `sprints` table | `Sprint` interface | Merge and enhance |
| **Bugs** | Not explicitly defined | `Bug` interface | Add to schema |
| **Versions** | Not explicitly defined | `Version` interface | Add to schema |
| **AI Insights** | `aiInsights` table | `AIInsight` interface | Merge and enhance |
| **Communication** | `chatChannels` and `chatMessages` tables | `CommunicationChannel` interface | Merge and enhance |
| **Multi-tenancy** | Supported with `tenants` table | Not explicitly supported | Maintain and enhance |
| **Time Tracking** | `timeEntries` table | Part of Task interface | Maintain and enhance |
| **Files/Attachments** | `files` table | Referenced in Task interface | Maintain and enhance |
| **Activity Logs** | `activities` table | Not explicitly defined | Maintain |
| **Notifications** | `notifications` table | Not explicitly defined | Maintain |
| **Video Meetings** | `videoMeetings` table | Not explicitly defined | Maintain |
| **Portfolios** | `portfolios` table | Not explicitly defined | Maintain |
| **Risks** | `risks` table | Not explicitly defined | Maintain |
| **Workflows** | `workflows` table | Not explicitly defined | Maintain |

## Key Differences and Integration Points

1. **Data Structure**:
   - Renexus_Replit uses Drizzle ORM with PostgreSQL
   - project-bolt uses TypeScript interfaces with in-memory data

2. **Relationship Handling**:
   - Renexus_Replit explicitly defines relations using Drizzle's relations API
   - project-bolt uses array references to related entities

3. **Schema Complexity**:
   - Renexus_Replit has a more comprehensive schema with multi-tenancy support
   - project-bolt has simpler interfaces but includes some entities not in Renexus_Replit

4. **Data Validation**:
   - Renexus_Replit uses Zod schemas for validation
   - project-bolt relies on TypeScript type checking

## Unified Schema Design

The unified schema will:

1. Maintain the Drizzle ORM structure from Renexus_Replit
2. Incorporate additional entities from project-bolt (Bugs, Versions)
3. Enhance existing entities with additional fields from project-bolt
4. Maintain multi-tenancy support
5. Keep the validation approach using Zod schemas

## Migration Strategy

1. Start with the Renexus_Replit schema as the base
2. Add missing entities from project-bolt
3. Enhance existing entities with additional fields
4. Create migration scripts for the unified schema
5. Implement data transformation for any existing data

## Next Steps

1. Create the unified schema definition
2. Develop migration scripts
3. Implement data validation and integrity checks
4. Set up backup and recovery procedures
