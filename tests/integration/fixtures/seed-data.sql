-- Seed data for integration testing
-- Phase 5.1.2 - Integration Testing

-- Users table
INSERT INTO users (id, name, email, password, role, created_at, updated_at) VALUES
('user-1', 'Admin User', 'admin@renexus.com', '$2b$10$VN4K9Mrr0Rw.1HVfIf3ml.4MKqIDSHQF7mQ9hPrZKQB2TfSBTvtVG', 'admin', NOW(), NOW()),
('user-2', 'Regular User', 'user@renexus.com', '$2b$10$VN4K9Mrr0Rw.1HVfIf3ml.4MKqIDSHQF7mQ9hPrZKQB2TfSBTvtVG', 'user', NOW(), NOW()),
('user-3', 'Project Manager', 'pm@renexus.com', '$2b$10$VN4K9Mrr0Rw.1HVfIf3ml.4MKqIDSHQF7mQ9hPrZKQB2TfSBTvtVG', 'manager', NOW(), NOW());

-- Projects table
INSERT INTO projects (id, name, description, owner_id, created_at, updated_at) VALUES
('proj-1', 'Test Project 1', 'A test project for integration testing', 'user-1', NOW(), NOW()),
('proj-2', 'Test Project 2', 'Another test project for integration testing', 'user-2', NOW(), NOW()),
('proj-3', 'Test Project 3', 'A third test project for integration testing', 'user-3', NOW(), NOW());

-- Project members
INSERT INTO project_members (id, project_id, user_id, role, created_at, updated_at) VALUES
('pm-1', 'proj-1', 'user-1', 'owner', NOW(), NOW()),
('pm-2', 'proj-1', 'user-2', 'member', NOW(), NOW()),
('pm-3', 'proj-1', 'user-3', 'manager', NOW(), NOW()),
('pm-4', 'proj-2', 'user-2', 'owner', NOW(), NOW()),
('pm-5', 'proj-2', 'user-3', 'member', NOW(), NOW()),
('pm-6', 'proj-3', 'user-3', 'owner', NOW(), NOW());

-- Tasks
INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, created_by, due_date, created_at, updated_at) VALUES
('task-1', 'Test Task 1', 'A test task for integration testing', 'TODO', 'HIGH', 'proj-1', 'user-1', 'user-1', NOW() + INTERVAL '7 days', NOW(), NOW()),
('task-2', 'Test Task 2', 'Another test task for integration testing', 'IN_PROGRESS', 'MEDIUM', 'proj-1', 'user-2', 'user-1', NOW() + INTERVAL '5 days', NOW(), NOW()),
('task-3', 'Test Task 3', 'A third test task for integration testing', 'DONE', 'LOW', 'proj-1', 'user-3', 'user-1', NOW() - INTERVAL '2 days', NOW(), NOW()),
('task-4', 'Test Task 4', 'A test task for project 2', 'TODO', 'HIGH', 'proj-2', 'user-2', 'user-2', NOW() + INTERVAL '10 days', NOW(), NOW()),
('task-5', 'Test Task 5', 'Another test task for project 2', 'IN_PROGRESS', 'MEDIUM', 'proj-2', 'user-3', 'user-2', NOW() + INTERVAL '3 days', NOW(), NOW()),
('task-6', 'Test Task 6', 'A test task for project 3', 'TODO', 'LOW', 'proj-3', 'user-3', 'user-3', NOW() + INTERVAL '14 days', NOW(), NOW());

-- Task comments
INSERT INTO task_comments (id, task_id, user_id, content, created_at, updated_at) VALUES
('comment-1', 'task-1', 'user-1', 'This is a test comment', NOW(), NOW()),
('comment-2', 'task-1', 'user-2', 'This is another test comment', NOW(), NOW()),
('comment-3', 'task-2', 'user-1', 'Test comment on task 2', NOW(), NOW()),
('comment-4', 'task-3', 'user-3', 'Task completed successfully', NOW(), NOW());

-- Task attachments
INSERT INTO task_attachments (id, task_id, user_id, file_name, file_path, file_size, file_type, created_at, updated_at) VALUES
('attachment-1', 'task-1', 'user-1', 'test_document.pdf', '/storage/attachments/test_document.pdf', 1024, 'application/pdf', NOW(), NOW()),
('attachment-2', 'task-2', 'user-2', 'test_image.jpg', '/storage/attachments/test_image.jpg', 2048, 'image/jpeg', NOW(), NOW());

-- Task history
INSERT INTO task_history (id, task_id, user_id, field_changed, old_value, new_value, created_at) VALUES
('history-1', 'task-1', 'user-1', 'status', 'TODO', 'IN_PROGRESS', NOW() - INTERVAL '2 days'),
('history-2', 'task-1', 'user-1', 'status', 'IN_PROGRESS', 'TODO', NOW() - INTERVAL '1 day'),
('history-3', 'task-3', 'user-3', 'status', 'IN_PROGRESS', 'DONE', NOW() - INTERVAL '1 day');

-- User sessions
INSERT INTO user_sessions (id, user_id, refresh_token, expires_at, created_at, updated_at) VALUES
('session-1', 'user-1', 'test-refresh-token-1', NOW() + INTERVAL '7 days', NOW(), NOW()),
('session-2', 'user-2', 'test-refresh-token-2', NOW() + INTERVAL '7 days', NOW(), NOW());

-- Settings
INSERT INTO user_settings (id, user_id, theme, notification_preferences, created_at, updated_at) VALUES
('settings-1', 'user-1', 'dark', '{"email": true, "push": true, "inApp": true}', NOW(), NOW()),
('settings-2', 'user-2', 'light', '{"email": true, "push": false, "inApp": true}', NOW(), NOW()),
('settings-3', 'user-3', 'system', '{"email": false, "push": false, "inApp": true}', NOW(), NOW());
