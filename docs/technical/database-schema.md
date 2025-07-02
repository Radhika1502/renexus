# Renexus Database Schema Documentation

## Database Overview

Renexus uses PostgreSQL as its primary database system. The schema is designed to support all the features of the application while maintaining referential integrity, optimizing for common query patterns, and ensuring data consistency.

## Entity Relationship Diagram (ERD)

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     users       │      │ project_members │      │    projects     │
├─────────────────┤      ├─────────────────┤      ├─────────────────┤
│ id              │◄────►│ user_id         │◄────►│ id              │
│ email           │      │ project_id      │      │ name            │
│ first_name      │      │ role            │      │ description     │
│ last_name       │      │ joined_at       │      │ status          │
│ password_hash   │      │                 │      │ start_date      │
│ role            │      │                 │      │ end_date        │
│ created_at      │      │                 │      │ owner_id        │
│ updated_at      │      │                 │      │ created_at      │
└─────────────────┘      └─────────────────┘      │ updated_at      │
        ▲                                         └─────────────────┘
        │                                                 ▲
        │                                                 │
┌───────┴───────┐                               ┌─────────┴─────────┐
│  user_profiles │                               │       tasks       │
├─────────────────┤                               ├─────────────────┤
│ user_id         │                               │ id              │
│ avatar_url      │                               │ title           │
│ bio             │      ┌─────────────────┐      │ description     │
│ location        │      │ task_comments   │      │ status          │
│ timezone        │      ├─────────────────┤      │ priority        │
│ preferences     │      │ id              │      │ due_date        │
│ created_at      │      │ task_id         │◄────►│ project_id      │
│ updated_at      │      │ user_id         │      │ assignee_id     │
└─────────────────┘      │ content         │      │ parent_task_id  │
                         │ created_at      │      │ created_by      │
                         │ updated_at      │      │ created_at      │
                         └─────────────────┘      │ updated_at      │
                                                  └─────────────────┘
                                                         ▲
                                                         │
                         ┌─────────────────┐             │
                         │ task_attachments│             │
                         ├─────────────────┤             │
                         │ id              │             │
                         │ task_id         │◄────────────┘
                         │ file_name       │
                         │ file_url        │      ┌─────────────────┐
                         │ file_type       │      │    activities   │
                         │ file_size       │      ├─────────────────┤
                         │ uploaded_by     │      │ id              │
                         │ created_at      │      │ user_id         │
                         └─────────────────┘      │ entity_type     │
                                                  │ entity_id       │
                                                  │ action          │
                         ┌─────────────────┐      │ metadata        │
                         │    analytics    │      │ created_at      │
                         ├─────────────────┤      └─────────────────┘
                         │ id              │
                         │ entity_type     │
                         │ entity_id       │      ┌─────────────────┐
                         │ metric_type     │      │   notifications  │
                         │ metric_value    │      ├─────────────────┤
                         │ timestamp       │      │ id              │
                         └─────────────────┘      │ user_id         │
                                                  │ type            │
                                                  │ entity_type     │
                                                  │ entity_id       │
                                                  │ message         │
                                                  │ is_read         │
                                                  │ created_at      │
                                                  └─────────────────┘
```

## Tables Schema

### users

Stores user account information.

| Column        | Type          | Constraints     | Description                            |
|---------------|---------------|-----------------|----------------------------------------|
| id            | uuid          | PK, NOT NULL    | Unique identifier for the user         |
| email         | varchar(255)  | UNIQUE, NOT NULL| User's email address                   |
| first_name    | varchar(100)  | NOT NULL        | User's first name                      |
| last_name     | varchar(100)  | NOT NULL        | User's last name                       |
| password_hash | varchar(255)  | NOT NULL        | Bcrypt hashed password                 |
| role          | varchar(50)   | NOT NULL        | User role (admin, user, etc.)          |
| created_at    | timestamp     | NOT NULL        | Record creation timestamp              |
| updated_at    | timestamp     | NOT NULL        | Record last update timestamp           |

### user_profiles

Stores additional user profile information.

| Column        | Type          | Constraints     | Description                            |
|---------------|---------------|-----------------|----------------------------------------|
| user_id       | uuid          | PK, FK, NOT NULL| Reference to users.id                  |
| avatar_url    | varchar(255)  |                 | URL to user's profile picture          |
| bio           | text          |                 | User's biography                       |
| location      | varchar(255)  |                 | User's location                        |
| timezone      | varchar(50)   |                 | User's timezone                        |
| preferences   | jsonb         |                 | User preferences as JSON               |
| created_at    | timestamp     | NOT NULL        | Record creation timestamp              |
| updated_at    | timestamp     | NOT NULL        | Record last update timestamp           |

### projects

Stores project information.

| Column        | Type          | Constraints     | Description                            |
|---------------|---------------|-----------------|----------------------------------------|
| id            | uuid          | PK, NOT NULL    | Unique identifier for the project      |
| name          | varchar(255)  | NOT NULL        | Project name                           |
| description   | text          |                 | Project description                    |
| status        | varchar(50)   | NOT NULL        | Project status                         |
| start_date    | timestamp     |                 | Project start date                     |
| end_date      | timestamp     |                 | Project end date                       |
| owner_id      | uuid          | FK, NOT NULL    | Reference to users.id (project owner)  |
| created_at    | timestamp     | NOT NULL        | Record creation timestamp              |
| updated_at    | timestamp     | NOT NULL        | Record last update timestamp           |

### project_members

Stores project membership information.

| Column        | Type          | Constraints           | Description                       |
|---------------|---------------|-----------------------|-----------------------------------|
| user_id       | uuid          | PK, FK, NOT NULL      | Reference to users.id             |
| project_id    | uuid          | PK, FK, NOT NULL      | Reference to projects.id          |
| role          | varchar(50)   | NOT NULL              | Role in project (member, editor)  |
| joined_at     | timestamp     | NOT NULL              | When user joined the project      |

### tasks

Stores task information.

| Column         | Type          | Constraints     | Description                            |
|----------------|---------------|-----------------|----------------------------------------|
| id             | uuid          | PK, NOT NULL    | Unique identifier for the task         |
| title          | varchar(255)  | NOT NULL        | Task title                             |
| description    | text          |                 | Task description                       |
| status         | varchar(50)   | NOT NULL        | Task status                            |
| priority       | varchar(50)   | NOT NULL        | Task priority                          |
| due_date       | timestamp     |                 | Task due date                          |
| project_id     | uuid          | FK, NOT NULL    | Reference to projects.id               |
| assignee_id    | uuid          | FK              | Reference to users.id (task assignee)  |
| parent_task_id | uuid          | FK              | Reference to tasks.id (parent task)    |
| created_by     | uuid          | FK, NOT NULL    | Reference to users.id (task creator)   |
| created_at     | timestamp     | NOT NULL        | Record creation timestamp              |
| updated_at     | timestamp     | NOT NULL        | Record last update timestamp           |

### task_comments

Stores comments on tasks.

| Column        | Type          | Constraints     | Description                            |
|---------------|---------------|-----------------|----------------------------------------|
| id            | uuid          | PK, NOT NULL    | Unique identifier for the comment      |
| task_id       | uuid          | FK, NOT NULL    | Reference to tasks.id                  |
| user_id       | uuid          | FK, NOT NULL    | Reference to users.id (comment author) |
| content       | text          | NOT NULL        | Comment content                        |
| created_at    | timestamp     | NOT NULL        | Record creation timestamp              |
| updated_at    | timestamp     | NOT NULL        | Record last update timestamp           |

### task_attachments

Stores file attachments for tasks.

| Column        | Type          | Constraints     | Description                            |
|---------------|---------------|-----------------|----------------------------------------|
| id            | uuid          | PK, NOT NULL    | Unique identifier for the attachment   |
| task_id       | uuid          | FK, NOT NULL    | Reference to tasks.id                  |
| file_name     | varchar(255)  | NOT NULL        | Original file name                     |
| file_url      | varchar(255)  | NOT NULL        | URL to the stored file                 |
| file_type     | varchar(100)  | NOT NULL        | MIME type of the file                  |
| file_size     | integer       | NOT NULL        | File size in bytes                     |
| uploaded_by   | uuid          | FK, NOT NULL    | Reference to users.id                  |
| created_at    | timestamp     | NOT NULL        | Record creation timestamp              |

### activities

Stores activity log entries.

| Column        | Type          | Constraints     | Description                            |
|---------------|---------------|-----------------|----------------------------------------|
| id            | uuid          | PK, NOT NULL    | Unique identifier for the activity     |
| user_id       | uuid          | FK, NOT NULL    | Reference to users.id                  |
| entity_type   | varchar(50)   | NOT NULL        | Type of entity (task, project, etc.)   |
| entity_id     | uuid          | NOT NULL        | ID of the related entity               |
| action        | varchar(50)   | NOT NULL        | Action performed                       |
| metadata      | jsonb         |                 | Additional data as JSON                |
| created_at    | timestamp     | NOT NULL        | Record creation timestamp              |

### notifications

Stores user notifications.

| Column        | Type          | Constraints     | Description                            |
|---------------|---------------|-----------------|----------------------------------------|
| id            | uuid          | PK, NOT NULL    | Unique identifier for the notification |
| user_id       | uuid          | FK, NOT NULL    | Reference to users.id                  |
| type          | varchar(50)   | NOT NULL        | Notification type                      |
| entity_type   | varchar(50)   |                 | Type of related entity                 |
| entity_id     | uuid          |                 | ID of the related entity               |
| message       | text          | NOT NULL        | Notification message                   |
| is_read       | boolean       | NOT NULL        | Whether notification is read           |
| created_at    | timestamp     | NOT NULL        | Record creation timestamp              |

### analytics

Stores analytics data.

| Column        | Type          | Constraints     | Description                            |
|---------------|---------------|-----------------|----------------------------------------|
| id            | uuid          | PK, NOT NULL    | Unique identifier                      |
| entity_type   | varchar(50)   | NOT NULL        | Type of entity                         |
| entity_id     | uuid          | NOT NULL        | ID of the entity                       |
| metric_type   | varchar(100)  | NOT NULL        | Type of metric                         |
| metric_value  | numeric       | NOT NULL        | Value of the metric                    |
| timestamp     | timestamp     | NOT NULL        | When the metric was recorded           |

## Indexes

### Primary Key Indexes
- users (id)
- user_profiles (user_id)
- projects (id)
- project_members (user_id, project_id)
- tasks (id)
- task_comments (id)
- task_attachments (id)
- activities (id)
- notifications (id)
- analytics (id)

### Foreign Key Indexes
- user_profiles (user_id)
- projects (owner_id)
- project_members (user_id)
- project_members (project_id)
- tasks (project_id)
- tasks (assignee_id)
- tasks (parent_task_id)
- tasks (created_by)
- task_comments (task_id)
- task_comments (user_id)
- task_attachments (task_id)
- task_attachments (uploaded_by)
- activities (user_id)
- notifications (user_id)

### Additional Indexes
- users (email)
- tasks (status)
- tasks (due_date)
- tasks (project_id, status)
- notifications (user_id, is_read)
- activities (entity_type, entity_id)
- activities (user_id, created_at)
- analytics (entity_type, entity_id, metric_type)
- analytics (timestamp)

## Database Migrations

Database migrations are managed using Prisma. Migration files are stored in the `prisma/migrations` directory. Each migration has:
1. A unique identifier based on timestamp
2. SQL up and down scripts
3. Documentation comments

## Data Consistency Rules

1. **Cascading Deletes**:
   - When a project is deleted, all associated tasks, comments, attachments, and project memberships are deleted
   - When a task is deleted, all associated comments and attachments are deleted

2. **Soft Deletes**:
   - Projects, tasks, and users implement soft delete via a `deleted_at` timestamp
   - Queries filter out soft-deleted records by default

3. **Default Values**:
   - `created_at` and `updated_at` are set automatically
   - Task `status` defaults to "todo"
   - Task `priority` defaults to "medium"

4. **Check Constraints**:
   - Project end_date must be after start_date
   - Task status must be one of: "todo", "in_progress", "review", "completed"
   - Task priority must be one of: "low", "medium", "high", "critical"

## Performance Considerations

1. **Partitioning**:
   - Activities table is partitioned by month
   - Analytics table is partitioned by month

2. **Materialized Views**:
   - `project_statistics` - Pre-calculated project metrics
   - `user_performance` - Pre-calculated user performance metrics

3. **Connection Pooling**:
   - PgBouncer is used for connection pooling
   - Pool size: 10-50 connections based on environment

4. **Query Optimization**:
   - Complex queries use CTEs for readability and performance
   - Large result sets use cursor-based pagination
   - Joins are optimized to minimize data transfer

## Security

1. **Row Level Security**:
   - Project data is protected by RLS policies
   - Users can only access data from projects they are members of

2. **Encryption**:
   - Sensitive data is encrypted at rest
   - Passwords are hashed using bcrypt

3. **Audit Logging**:
   - All data modifications are logged in the activities table
   - Database-level audit logging is enabled

4. **Access Control**:
   - Database users have least privilege access
   - Application uses a service account with limited permissions
