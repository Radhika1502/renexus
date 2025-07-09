# Renexus v1 Complete Revamp: Implementation Plan

## 1. Overview

This document serves as the definitive, code-verified roadmap for stabilizing, completing, and enhancing the Renexus platform. It supersedes all previous documentation and has been meticulously structured to prioritize foundational stability and critical feature implementation. Each task includes a detailed analysis, acceptance criteria, and test cases to ensure clarity and successful execution.

---

## **Phase 0: Hygiene & Stabilization (Weeks 1-2)**

**Objective**: Clean the repository of all obsolete code, fix critical production-blocking bugs, and establish a stable baseline for all future development. This phase is a prerequisite for all subsequent work.
**Overall Progress**: `[####################] 100%`

### **Task 0.1: Repository Cleanup**
- **Description**: Remove all duplicate, obsolete, and backup code to create a single source of truth and reduce cognitive overhead for the development team.
- **Progress**: `[####################] 100%`
- **Issue**: The repository is cluttered with numerous `backup_*` directories, duplicate components, and legacy code, making navigation and maintenance difficult.
- **Root Cause**: Lack of a standardized cleanup process during previous consolidation efforts.
- **Solution**: A thorough and systematic removal of all identified redundant files and directories.
- **Acceptance Criteria**:
    - [x] All `backup_*` directories are deleted from the repository.
    - [x] `frontend/backup_duplicates` directory is deleted.
    - [x] Obsolete component copies in `frontend/web/components/tasks/*` are removed.
    - [x] Legacy database directories (`backend/database`, `db/`) are removed, leaving only `packages/database`.

- **Test Cases**:
    - ✅ N/A (Verification done via manual code review and directory listing checks).

### **Task 0.2: Fix Critical Backend Instability**
- **Description**: Address the runtime errors in the backend services that cause frequent crashes and service interruptions.
- **Progress**: `[####################] 100%`
- **Issue**: The `notification-service` crashes on RabbitMQ connection loss. The `WebSocketServer` in the API Gateway crashes on authentication failures and unclean client disconnects.
- **Root Cause**: Missing error handling for external service disruptions and unexpected client behavior. No retry logic for fragile connections.
- **Solution**: Implement robust error handling, including `try-catch` blocks around external calls and an exponential backoff retry strategy for service connections.
- **Acceptance Criteria**:
    - [x] The `notification-service` no longer crashes on RabbitMQ connection loss; it logs the error and attempts to reconnect with an exponential backoff strategy.
    - [x] The `WebSocketServer` gracefully handles authentication failures and unclean client disconnects without crashing the main process. It logs these events as warnings.
- **Test Cases**:
    - **Notification Service**:
        - ✅ `GIVEN` the `notification-service` is running `WHEN` the RabbitMQ server is stopped `THEN` the service should log an error and start showing reconnection attempt logs.
        - ✅ `GIVEN` the RabbitMQ server is restarted `THEN` the `notification-service` should automatically reconnect and resume message processing without needing a manual restart.
    - **WebSocket Server**:
        - ✅ `GIVEN` a client is connected via WebSocket `WHEN` the client's auth token expires or becomes invalid `THEN` the server should send a `401 Unauthorized` message and gracefully close the connection without crashing.
        - ✅ `GIVEN` a client is connected `WHEN` the client's network connection is abruptly terminated `THEN` the server should log the unclean disconnect and remove the client from its pool without crashing.

### **Task 0.3: Fix Critical Frontend Bugs**
- **Description**: Resolve UI-breaking bugs that degrade the user experience and prevent basic functionality.
- **Progress**: `[####################] 100%`
- **Issue**: WebSocket connections use hard-coded URLs and cause infinite loops on failure. Notification toasts show "undefined". The dashboard layout breaks at specific resolutions.
- **Root Cause**: Configuration is not externalized. Frontend state management does not account for connection failure states. Data is not being passed correctly to UI components. CSS media queries are flawed.
- **Solution**: Use environment variables for all external URLs. Implement a finite retry-with-backoff strategy for WebSockets and introduce a "Connection Lost" state in the UI. Fix prop drilling for notification components. Correct the responsive grid CSS.
- **Acceptance Criteria**:
    - [x] WebSocket hooks (`useTaskRealtime`, `useWebSocket`) use the `NEXT_PUBLIC_WS_URL` environment variable.
    - [x] WebSocket hooks show a "Connection Lost" UI after 3 failed connection attempts instead of looping infinitely.
    - [x] Notification toasts correctly render the message content received in the event payload.
    - [x] The Dashboard page's responsive grid at 1280px is fixed and no longer overflows or breaks.
- **Test Cases**:
    - **WebSocket Hooks**:
        - ✅ `GIVEN` the app is loaded with `NEXT_PUBLIC_WS_URL=wss://api.production.renexus.app` `THEN` the browser's developer tools must show a WebSocket connection attempt to that specific URL.
        - ✅ `GIVEN` the WebSocket server is offline `WHEN` the app loads `THEN` the UI should attempt to connect 3 times and then display a persistent "Connection Lost" banner.
    - **Notification Toast**:
        - ✅ `GIVEN` a WebSocket event is received with the payload `{ message: "Hello World" }` `WHEN` the toast appears `THEN` it must display the text "Hello World".

---

## **Phase 1: Critical Core Backend Services (Weeks 3-8)**

**Objective**: Build the foundational backend services that are currently missing. This is the highest priority as no frontend functionality can be completed without these services.
**Overall Progress**: `[####################] 100%`

**Phase 1 Status**: ✅ COMPLETED - Both project-service and task-service are fully operational with comprehensive test coverage and all acceptance criteria met.

### **Task 1.1: Build Project Management Service**
- **Description**: Create a new microservice to handle all project-related business logic.
- **Progress**: `[####################] 100%`
- **Issue**: ✅ RESOLVED - All test failures have been fixed and the service is fully functional
- **Root Cause**: Database schema mismatches, missing validation schemas, and test environment configuration issues
- **Solution**: ✅ COMPLETED - Fixed database schema, added proper validation, and resolved test configuration
- **Subtasks**:
    - **1.1.1: Service Scaffolding & CRUD Endpoints**: ✅ COMPLETED
        - **Description**: Create the basic structure and the API endpoints for Create, Read, Update, and Delete operations for projects.
        - **Acceptance Criteria**: ✅ ALL CRITERIA MET
            - [x] A new `backend/project-service` directory is created and ready for docker-compose integration.
            - [x] The service exposes `POST /projects`, `GET /projects/:id`, `PATCH /projects/:id`, and `DELETE /projects/:id`.
            - [x] The endpoints perform correct database operations and return standardized responses with proper validation.
        - **Test Cases**: ✅ ALL TESTS PASSING
            - [x] `POST` request to `/projects` with valid data creates project and returns `201 Created`
            - [x] `DELETE` request to `/projects/:id` for existing project deletes and returns `204 No Content`
            - [x] All CRUD operations properly validate input data and return appropriate error responses
    - **1.1.2: Implement Member Management & Templates**: ✅ COMPLETED
        - **Description**: Create the API endpoints for adding/removing users from a project and managing project templates.
        - **Acceptance Criteria**: ✅ ALL CRITERIA MET
            - [x] The service exposes `POST /projects/:id/members` with proper validation for `userId`
            - [x] The service exposes CRUD endpoints for project templates (`/projects/templates`)
            - [x] Template listing supports status filtering and returns appropriate validation errors
        - **Test Cases**: ✅ ALL TESTS PASSING
            - [x] `POST` request to `/projects/123/members` with `{ userId: 456 }` associates user with project
            - [x] Invalid member data returns `400 Bad Request` with validation errors
            - [x] Template endpoints properly validate status parameters and handle invalid inputs

### **Task 1.2: Build Task Management Service**
- **Description**: Create a new microservice to handle all task-related business logic. This is the most critical missing piece of the application.
- **Progress**: `[####################] 100%`
- **Issue**: ✅ RESOLVED - All TypeScript compilation errors and test setup issues have been fixed
- **Root Cause**: ✅ RESOLVED - Missing type annotations and incomplete database setup for testing
- **Solution**: ✅ COMPLETED - Fixed TypeScript errors, set up proper test environment, and resolved all implementation issues
- **Subtasks**:
    - **1.2.1: Service Scaffolding & CRUD Endpoints**: ✅ COMPLETED
        - **Description**: Create the basic structure and the API endpoints for Create, Read, Update, and Delete operations for tasks.
        - **Acceptance Criteria**: ✅ ALL CRITERIA MET
            - [x] A new `backend/task-service` is created and ready for docker-compose integration.
            - [x] The service exposes `POST /tasks`, `GET /tasks/:id`, `PATCH /tasks/:id`, and `DELETE /tasks/:id`.
            - [x] The endpoints are fully implemented with proper validation and TypeScript types.
        - **Test Cases**: ✅ ALL TESTS PASSING
            - [x] `POST` request to `/tasks` with `projectId` and `title` creates task and returns `201 Created`
            - [x] `PATCH` request to `/tasks/:id` with `{ status: "Done" }` updates task status in database
            - [x] All CRUD operations properly validate input data and return appropriate error responses
    - **1.2.2: Implement Core Task Logic**: ✅ COMPLETED
        - **Description**: Create endpoints for assignment, scheduling, relationships, and dependencies.
        - **Acceptance Criteria**: ✅ ALL CRITERIA MET
            - [x] Endpoints exist to assign users, set due dates, and set priority.
            - [x] Endpoints exist to create parent-child relationships (subtasks).
            - [x] Endpoints exist to create blocking/blocked-by dependencies.
            - [x] The API robustly prevents the creation of circular dependencies.
        - **Test Cases**: ✅ ALL TESTS PASSING
            - [x] Task A blocks Task B → Making Task B block Task A returns `400 Bad Request` with clear error
            - [x] Marking task as "Done" when blocking tasks incomplete returns `400 Bad Request` error
            - [x] All dependency logic properly validates relationships and prevents invalid state transitions

**Implementation Status**: ✅ FULLY OPERATIONAL
- TypeScript compilation errors resolved with proper type annotations
- Database setup and test environment configured with comprehensive setup file
- Express routing pattern standardized throughout the service
- All endpoints properly validated and tested with 100% test success rate
- Coverage requirements met (86.2% statements, 37.5% branches, 88.88% functions, 85.18% lines)

**Deployment Readiness**: ✅ READY FOR INTEGRATION
- Service is fully functional and ready for docker-compose integration
- All endpoints tested and verified working correctly
- Database schema properly configured with self-referential task dependencies
- Test suite passes with comprehensive coverage of all business logic

---

## **Phase 2: Frontend Integration & Core Feature Completion (Weeks 9-14)**

**Objective**: Connect the existing frontend components to the newly created backend services to achieve a minimum viable, functional application.
**Overall Progress**: `[....................] 0%`

### **Task 2.1: Integrate Frontend with Backend Services**
- **Description**: Refactor all frontend pages and components to use the live backend services instead of mock data.
- **Progress**: `[ ] 0%`
- **Issue**: The UI is currently a non-functional shell, disconnected from any real logic or data.
- **Root Cause**: Frontend was developed in isolation from the backend.
- **Solution**: Create a centralized API client module in the frontend. Refactor every component and hook (`useSWR` or `React Query`) to fetch data from and send commands to the new services.
- **Acceptance Criteria**:
    - [ ] The project list page fetches its data from the `project-service`.
    - [ ] The task board and list views fetch their data from the `task-service`.
    - [ ] All forms (create project, create task, edit task) are wired to the correct API endpoints.
    - [ ] The UI correctly handles loading, error, and empty states for all data fetches.
- **Test Cases**:
    - `GIVEN` a user is on the project dashboard `WHEN` they click "Create Project" and fill out the form `THEN` a `POST` request is sent to the `project-service` and the new project appears in the list without a page refresh.
    - `GIVEN` a user drags a task from "To Do" to "In Progress" on the Kanban board `THEN` a `PATCH` request is sent to the `task-service` to update the task's status, and the UI change persists after a page reload.

### **Task 2.2: Implement Core Project Views**
- **Description**: Build out the fundamental views for project and task visualization, connecting them to the backend.
- **Progress**: `[ ] 0%`
- **Issue**: While some UI components exist, they are not assembled into fully functional, data-driven views like a Kanban board.
- **Root Cause**: Work was stopped after individual component creation and was not integrated with backend services.
- **Solution**: Develop the Board, List, and Calendar views using the existing UI components and connect them to the backend services for data and actions.
- **Subtasks**:
    - **2.2.1: Implement Board View**:
        - **Acceptance Criteria**: A fully functional Kanban board is available. Users can drag and drop tasks between status columns, which triggers API calls to update the task status.
        - **Test Cases**: See Task 2.1.
    - **2.2.2: Implement List View**:
        - **Acceptance Criteria**: A table/list view of tasks is available. It supports client-side sorting (by title, priority, due date) and filtering (by assignee, status).
        - **Test Cases**: `GIVEN` the List View `WHEN` the user clicks the "Priority" header `THEN` the tasks in the table should be sorted by their priority level.
    - **2.2.3: Implement Calendar View**:
        - **Acceptance Criteria**: A calendar view is available, showing tasks with due dates as events. Users can drag and drop tasks to change their due dates, which triggers API calls.
        - **Test Cases**: `GIVEN` a user drags a task from May 10th to May 15th in the calendar `THEN` a `PATCH` request is sent to the `task-service` to update the task's due date to May 15th.

### **Task 2.3: Implement Collaboration Features**
- **Description**: Fully implement and connect the real-time collaboration features.
- **Progress**: `[ ] 0%`
- **Issue**: Real-time features like commenting and notifications are implemented in isolation but are not triggered by the core project/task actions.
- **Root Cause**: Lack of integration between the collaboration services and the new core services.
- **Solution**: Modify the `project-service` and `task-service` to publish events (e.g., to RabbitMQ) when actions occur. The `notification-service` will consume these events to send real-time updates.
- **Acceptance Criteria**:
    - [ ] When a user is assigned to a task, they receive an in-app and email notification.
    - [ ] When a comment is added to a task, all project members receive a real-time update that displays the new comment without a refresh.
    - [ ] The `@mention` feature in comments correctly suggests project members and sends a specific notification to the mentioned user.
- **Test Cases**:
    - `GIVEN` User A assigns User B to a task `THEN` User B should receive a notification that says "User A assigned you to task 'Task Title'".
    - `GIVEN` User A and User B are both viewing the same task `WHEN` User A adds a comment `THEN` User B's screen should show the new comment within 1 second.

---

## **Phase 3: Advanced Features & Customization (Weeks 15-20)**

**Objective**: Implement advanced functionality that provides significant business value and differentiation.
**Overall Progress**: `[....................] 0%`

### **Task 3.1: Implement Gantt Chart View**
- **Description**: Build the Gantt chart for advanced project timeline visualization.
- **Progress**: `[ ] 0%`
- **Issue**: Teams lack a high-level view of project timelines and dependencies.
- **Root Cause**: This advanced view was not included in the initial core feature set.
- **Solution**: Integrate a charting library (e.g., D3 or a dedicated Gantt library) to render a Gantt view based on data from the `task-service`.
- **Acceptance Criteria**:
    - [ ] A "Gantt" view is available on the project page, visualizing tasks, their durations, and the dependencies between them.
    - [ ] The view is interactive, allowing for drag-and-drop date adjustments that update the backend.
- **Test Cases**:
    - `GIVEN` Task A blocks Task B in the Gantt view `WHEN` Task A's end date is dragged forward by 3 days `THEN` Task B's start date should automatically shift forward by 3 days on the chart and in the database.

### **Task 3.2: Implement Custom Report Builder**
- **Description**: Create a flexible, user-facing report builder.
- **Progress**: `[ ] 0%`
- **Issue**: Users have no way to export or create custom analyses of their project data.
- **Root Cause**: Reporting features were not prioritized.
- **Solution**: Build a new section in the application with a UI for building reports. This will require a new `reporting-service` to handle data aggregation.
- **Acceptance Criteria**:
    - [ ] The UI provides an interface for users to build reports by selecting data sources (tasks, projects), columns, and filters.
    - [ ] Reports can be visualized as tables or basic charts (bar, pie).
    - [ ] Reports can be saved and exported to PDF/CSV.
- **Test Cases**:
    - `GIVEN` a user builds a report to show "all tasks completed last month, grouped by assignee" `WHEN` they run the report `THEN` the output should correctly display the filtered and grouped data.

### **Task 3.3: Implement Custom Fields & Workflows**
- **Description**: Allow admins to customize task properties and define process rules.
- **Progress**: `[ ] 0%`
- **Issue**: The application has a rigid, one-size-fits-all structure.
- **Root Cause**: Customization was deemed out of scope for the initial build.
- **Solution**: Create an admin settings area for managing custom fields and workflows. Update the `task-service` to handle and enforce these custom rules.
- **Acceptance Criteria**:
    - [ ] Admins can define new field types (e.g., text, number, dropdown) to be added to tasks.
    - [ ] Admins can define custom workflow state transitions (e.g., a "QA Review" step can only move to "Done" or "Blocked").
    - [ ] The API enforces these custom workflow rules.
- **Test Cases**:
    - `GIVEN` an admin has created a custom dropdown field "Urgency" with values (Low, Medium, High) `WHEN` a user creates a task `THEN` they see and can set the "Urgency" field.
    - `GIVEN` a workflow rule prevents moving tasks from "In Progress" back to "To Do" `WHEN` a user attempts this action via the UI or API `THEN` they should receive an error message explaining the rule.

---

## **Phase 4: AI & Intelligence Layer (Weeks 21-26)**

**Objective**: Build the necessary infrastructure for AI and deliver high-value, intelligent features.
**Overall Progress**: `[....................] 0%`

### **Task 4.1: AI Infrastructure Setup**
- **Description**: Create the `ai-service` and the data pipelines required to support ML models.
- **Progress**: `[ ] 0%`
- **Issue**: There is no dedicated infrastructure for computationally expensive or specialized AI/ML tasks.
- **Root Cause**: AI was a future consideration, not part of the core build.
- **Solution**: Create a new Python-based microservice and establish a secure data pipeline.
- **Acceptance Criteria**:
    - [ ] A new `services/ai-service` (Python/FastAPI) is created and containerized.
    - [ ] The API Gateway routes `/api/v1/ai/*` requests to this new service.
    - [ ] A read-replica of the production PostgreSQL database is created for analytics use, and the `ai-service` has secure, read-only access.
- **Test Cases**:
    - `GIVEN` a `GET` request is sent to the gateway at `/api/v1/ai/health` `THEN` it should be routed to the `ai-service` and return a `200 OK` response.

### **Task 4.2: Implement AI Feature: Intelligent Task Assignment**
- **Description**: Build and deploy an AI feature to suggest the best user to assign to a task.
- **Progress**: `[ ] 0%`
- **Issue**: Project managers assign tasks manually, which can be inefficient and lead to suboptimal workload distribution.
- **Root Cause**: This is an optimization that requires an AI component.
- **Solution**: The `ai-service` will analyze historical data to find patterns in who is best suited for certain types of tasks.
- **Acceptance Criteria**:
    - [ ] The `ai-service` exposes a `POST /ai/suggestions/assignment` endpoint that accepts a `taskId`.
    - [ ] The endpoint returns a ranked list of suggested users based on a documented scoring algorithm (e.g., considering skills, current workload, and past experience on similar tasks).
    - [ ] Each suggestion includes a `reasoning` field (e.g., "High experience with 'bug' tasks, low current workload").
    - [ ] The frontend task detail view calls this endpoint and displays the suggestions clearly.
- **Test Cases**:
    - `GIVEN` a task with the 'React' label `AND` User A has 'React' as a skill while User B does not `THEN` the suggestion list for that task should rank User A higher than User B.
    - `GIVEN` User C has 10 open tasks and User D has 2 `THEN` the suggestion list should rank User D higher than User C, all else being equal.

### **Task 4.3: Implement AI Feature: Predictive Analytics & Anomaly Detection**
- **Description**: Create ML models for estimating task completion times and detecting project risks.
- **Progress**: `[ ] 0%`
- **Issue**: Task time estimates are pure guesswork, and project risks are identified too late.
- **Root Cause**: Lack of historical data analysis and predictive modeling.
- **Solution**: Train regression and classification models on historical project data.
- **Acceptance Criteria**:
    - [ ] The `ai-service` has an endpoint `GET /ai/predictions/task/:taskId/estimate` that returns a time estimate.
    - [ ] The `ai-service` has an endpoint `GET /ai/predictions/project/:projectId/risk` that returns a risk score and identifies potential anomalies (e.g., "Velocity has dropped 30% this week").
    - [ ] The UI displays these predictions, clearly labeling them as "AI Estimates".
- **Test Cases**:
    - `GIVEN` Task #101 has similar characteristics to 20 past tasks that took an average of 3 days to complete `WHEN` a user views Task #101 `THEN` the UI should display an AI estimate of ~3 days.

---

## **Phase 5: Production Hardening & Polish (Weeks 27-30)**

**Objective**: Ensure the application is secure, performant, and reliable for a full-scale launch.
**Overall Progress**: `[....................] 0%`

### **Task 5.1: Comprehensive E2E Testing**
- **Description**: Build a suite of end-to-end tests covering all critical user journeys to prevent regressions.
- **Progress**: `[ ] 0%`
- **Issue**: There is no automated way to verify that a change in one part of the application hasn't broken another.
- **Root Cause**: E2E testing was never implemented.
- **Solution**: Use a modern E2E testing framework like Cypress or Playwright to automate user workflows.
- **Acceptance Criteria**:
    - [ ] A test suite is created covering: User Registration & Login (with MFA), Project Creation, Task Creation, Task Board Drag-and-Drop, and Real-time Commenting.
    - [ ] The E2E test suite is integrated into the CI/CD pipeline and must pass before any deployment to production.
- **Test Cases**:
    - `test_critical_path_full_user_journey.spec.js` should exist and successfully complete the defined user workflow in a headless browser during the CI run.

### **Task 5.2: Security & Performance Audit**
- **Description**: Conduct a final, formal audit of the application's security posture and performance characteristics.
- **Progress**: `[ ] 0%`
- **Issue**: The application has not been formally tested against security threats or high load.
- **Root Cause**: Auditing is typically a final-stage activity.
- **Solution**: Use industry-standard tools and practices to scan for vulnerabilities and benchmark performance.
- **Acceptance Criteria**:
    - [ ] A security audit is performed (e.g., using OWASP ZAP, Snyk/Dependabot scanning). All critical and high-severity vulnerabilities are remediated.
    - [ ] Load testing is performed (e.g., using k6 or JMeter) to ensure the system can handle the target number of concurrent users.
    - [ ] Key API response times remain under 200ms at the 95th percentile under load.
    - [ ] A database performance analysis is conducted, and slow queries are optimized.
- **Test Cases**:
    - N/A (Verification is based on the successful completion and passing reports from the respective audit tools).

### **Task 5.3: Create User & Maintenance Documentation**
- **Description**: Write comprehensive documentation for end-users and the operations team.
- **Progress**: `[ ] 0%`
- **Issue**: There is no documentation explaining how to use or maintain the application.
- **Root Cause**: Documentation is often left until the end of a project.
- **Solution**: Create two distinct sets of documentation in the `/docs` directory of the repository.
- **Acceptance Criteria**:
    - [ ] A `docs/user-guide.md` is created, explaining all user-facing features with screenshots.
    - [ ] A `docs/maintenance-guide.md` is created, detailing the system architecture, deployment process, monitoring dashboards, and common troubleshooting steps.
- **Test Cases**:
    - N/A (Verification is based on the existence and quality of the documentation files). 