# UAT Test Case Example: Project Creation
## Phase 5.2.4 - User Acceptance Testing Support

| Test Case Information |                                |
|-----------------------|--------------------------------|
| **Test Case ID**      | UAT-TC-002                     |
| **Test Case Title**   | New Project Creation Process   |
| **Feature/Module**    | Project Management             |
| **Priority**          | High                           |
| **Created By**        | UAT Team Lead                  |
| **Created Date**      | 2025-06-29                     |

## Test Objective
Verify that authorized users can create a new project with all required information, and that the project is properly stored in the system with correct permissions.

## Pre-conditions
- User is logged in with appropriate permissions to create projects
- User has access to the project management module
- Required project fields/templates are configured in the system

## Test Data Requirements
- Project name, description, and other required metadata
- Team members to add to the project (at least 2)
- Project timeline information (start date, target end date)

## Test Steps

| Step No. | Description | Expected Result |
|----------|-------------|----------------|
| 1        | Navigate to the Dashboard or Projects section | Projects view is displayed with a "Create New Project" or "+" button |
| 2        | Click on "Create New Project" or "+" button | Project creation form is displayed |
| 3        | Enter a unique project name | Field accepts the input |
| 4        | Enter a detailed project description | Field accepts the input |
| 5        | Select project start date | Date picker functions correctly and accepts valid date |
| 6        | Select target end date | Date picker functions correctly and accepts valid date that is after start date |
| 7        | Add project team members and assign roles | User search/selection works and roles can be assigned |
| 8        | Select project category/type (if applicable) | Category selection works properly |
| 9        | Upload any initial project documents (if applicable) | Document upload functionality works correctly |
| 10       | Click "Create Project" or "Save" button | System processes the creation and displays a success message |
| 11       | Verify the project appears in your projects list | New project is visible in the projects list |
| 12       | Open the newly created project | Project details page opens with all entered information correct |
| 13       | Verify team members received notifications | Team members confirm they received project assignment notifications |

## Post-conditions
- New project is created in the system with correct information
- Project is visible to all team members with appropriate permissions
- Project appears in relevant dashboards and reports
- Project history shows creation record

## Special Instructions
- Test with different user roles to verify permission controls
- Verify validation for required fields
- Test date validation (end date must be after start date)

## Test Results (To be completed by tester)

| Result       | ☐ Pass  ☐ Fail  ☐ Blocked  ☐ Not Tested |
|--------------|------------------------------------------|
| **Tested By**| [Tester Name]                            |
| **Test Date**| [Test Execution Date]                    |
| **Test Environment** | [Environment Details]            |
| **Comments** | [Any observations or notes]              |
| **Defects**  | [Reference to defect reports if any]     |

## Screenshots/Attachments
[Placeholder for relevant screenshots or files]

## Approval
| Role              | Name              | Signature         | Date      |
|-------------------|-------------------|------------------|-----------|
| Tester            | [Name]            | ________________ | _________ |
| UAT Coordinator   | [Name]            | ________________ | _________ |
