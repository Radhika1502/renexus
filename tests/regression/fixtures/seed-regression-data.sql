-- Seed data for regression testing
-- Phase 5.2.3 - Regression Testing

-- Users table with consistent test data for regression tests
INSERT INTO users (id, name, email, password, role, created_at, updated_at) VALUES
('reg-user-1', 'Regression Admin', 'reg-admin@renexus.com', '$2b$10$VN4K9Mrr0Rw.1HVfIf3ml.4MKqIDSHQF7mQ9hPrZKQB2TfSBTvtVG', 'admin', NOW(), NOW()),
('reg-user-2', 'Regression User', 'reg-user@renexus.com', '$2b$10$VN4K9Mrr0Rw.1HVfIf3ml.4MKqIDSHQF7mQ9hPrZKQB2TfSBTvtVG', 'user', NOW(), NOW()),
('reg-user-3', 'Regression Manager', 'reg-manager@renexus.com', '$2b$10$VN4K9Mrr0Rw.1HVfIf3ml.4MKqIDSHQF7mQ9hPrZKQB2TfSBTvtVG', 'manager', NOW(), NOW());

-- Projects table with known data for regression comparisons
INSERT INTO projects (id, name, description, owner_id, created_at, updated_at) VALUES
('reg-proj-1', 'Regression Project 1', 'A baseline project for regression testing', 'reg-user-1', NOW(), NOW()),
('reg-proj-2', 'Regression Project 2', 'Another baseline project for regression testing', 'reg-user-2', NOW(), NOW()),
('reg-proj-3', 'Regression Project 3', 'A third baseline project for regression testing', 'reg-user-3', NOW(), NOW());

-- Project members with consistent roles
INSERT INTO project_members (id, project_id, user_id, role, created_at, updated_at) VALUES
('reg-pm-1', 'reg-proj-1', 'reg-user-1', 'owner', NOW(), NOW()),
('reg-pm-2', 'reg-proj-1', 'reg-user-2', 'member', NOW(), NOW()),
('reg-pm-3', 'reg-proj-1', 'reg-user-3', 'manager', NOW(), NOW()),
('reg-pm-4', 'reg-proj-2', 'reg-user-2', 'owner', NOW(), NOW()),
('reg-pm-5', 'reg-proj-2', 'reg-user-3', 'member', NOW(), NOW()),
('reg-pm-6', 'reg-proj-3', 'reg-user-3', 'owner', NOW(), NOW());

-- Tasks with predefined states for regression validation
INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, created_by, due_date, created_at, updated_at) VALUES
('reg-task-1', 'Regression Task 1', 'A baseline task for regression testing', 'TODO', 'HIGH', 'reg-proj-1', 'reg-user-1', 'reg-user-1', NOW() + INTERVAL '7 days', NOW(), NOW()),
('reg-task-2', 'Regression Task 2', 'Another baseline task for regression testing', 'IN_PROGRESS', 'MEDIUM', 'reg-proj-1', 'reg-user-2', 'reg-user-1', NOW() + INTERVAL '5 days', NOW(), NOW()),
('reg-task-3', 'Regression Task 3', 'A completed baseline task for regression testing', 'DONE', 'LOW', 'reg-proj-1', 'reg-user-3', 'reg-user-1', NOW() - INTERVAL '2 days', NOW(), NOW()),
('reg-task-4', 'Regression Task 4', 'A baseline task for project 2', 'TODO', 'HIGH', 'reg-proj-2', 'reg-user-2', 'reg-user-2', NOW() + INTERVAL '10 days', NOW(), NOW()),
('reg-task-5', 'Regression Task 5', 'Another baseline task for project 2', 'IN_PROGRESS', 'MEDIUM', 'reg-proj-2', 'reg-user-3', 'reg-user-2', NOW() + INTERVAL '3 days', NOW(), NOW()),
('reg-task-6', 'Regression Task 6', 'A baseline task for project 3', 'TODO', 'LOW', 'reg-proj-3', 'reg-user-3', 'reg-user-3', NOW() + INTERVAL '14 days', NOW(), NOW());

-- Task comments with predictable content
INSERT INTO task_comments (id, task_id, user_id, content, created_at, updated_at) VALUES
('reg-comment-1', 'reg-task-1', 'reg-user-1', 'This is a baseline comment for regression testing', NOW(), NOW()),
('reg-comment-2', 'reg-task-1', 'reg-user-2', 'This is another baseline comment for regression testing', NOW(), NOW()),
('reg-comment-3', 'reg-task-2', 'reg-user-1', 'Baseline comment on task 2 for regression', NOW(), NOW()),
('reg-comment-4', 'reg-task-3', 'reg-user-3', 'Task completed successfully - regression baseline', NOW(), NOW());

-- Task attachments with consistent test files
INSERT INTO task_attachments (id, task_id, user_id, file_name, file_path, file_size, file_type, created_at, updated_at) VALUES
('reg-attachment-1', 'reg-task-1', 'reg-user-1', 'regression_document.pdf', '/storage/attachments/regression_document.pdf', 1024, 'application/pdf', NOW(), NOW()),
('reg-attachment-2', 'reg-task-2', 'reg-user-2', 'regression_image.jpg', '/storage/attachments/regression_image.jpg', 2048, 'image/jpeg', NOW(), NOW());

-- Task history with known state transitions
INSERT INTO task_history (id, task_id, user_id, field_changed, old_value, new_value, created_at) VALUES
('reg-history-1', 'reg-task-1', 'reg-user-1', 'status', 'TODO', 'IN_PROGRESS', NOW() - INTERVAL '2 days'),
('reg-history-2', 'reg-task-1', 'reg-user-1', 'status', 'IN_PROGRESS', 'TODO', NOW() - INTERVAL '1 day'),
('reg-history-3', 'reg-task-3', 'reg-user-3', 'status', 'IN_PROGRESS', 'DONE', NOW() - INTERVAL '1 day');

-- User sessions with controlled tokens
INSERT INTO user_sessions (id, user_id, refresh_token, expires_at, created_at, updated_at) VALUES
('reg-session-1', 'reg-user-1', 'regression-refresh-token-1', NOW() + INTERVAL '7 days', NOW(), NOW()),
('reg-session-2', 'reg-user-2', 'regression-refresh-token-2', NOW() + INTERVAL '7 days', NOW(), NOW());

-- Settings with consistent preferences
INSERT INTO user_settings (id, user_id, theme, notification_preferences, created_at, updated_at) VALUES
('reg-settings-1', 'reg-user-1', 'dark', '{"email": true, "push": true, "inApp": true}', NOW(), NOW()),
('reg-settings-2', 'reg-user-2', 'light', '{"email": true, "push": false, "inApp": true}', NOW(), NOW()),
('reg-settings-3', 'reg-user-3', 'system', '{"email": false, "push": false, "inApp": true}', NOW(), NOW());
