/**
 * Training data for the intent recognition system
 * Contains example phrases mapped to intents for model training
 */

import { IntentType } from './intent-recognition';

// Training example interface
export interface TrainingExample {
  text: string;
  intent: IntentType;
}

// Training data interface
export interface TrainingData {
  examples: TrainingExample[];
}

/**
 * Get training data for intent recognition
 * @returns Training data with examples for each supported intent
 */
export function getTrainingData(): TrainingData {
  return {
    examples: [
      // Create task examples
      { text: "Create a new task", intent: "create_task" },
      { text: "Add task to review documentation", intent: "create_task" },
      { text: "I need to create a task for tomorrow", intent: "create_task" },
      { text: "Make a new high priority task", intent: "create_task" },
      { text: "Add a task to implement login page", intent: "create_task" },
      { text: "Create task with deadline next week", intent: "create_task" },
      { text: "New task: fix navigation bug", intent: "create_task" },
      { text: "Add a task for the sprint planning", intent: "create_task" },
      { text: "Create urgent task for security patch", intent: "create_task" },
      { text: "I want to add a new task to my list", intent: "create_task" },
      { text: "Create a task for #frontend", intent: "create_task" },
      { text: "Add low priority task for documentation", intent: "create_task" },
      { text: "Create a task due on 12/15/2023", intent: "create_task" },
      { text: "New task with @john assigned", intent: "create_task" },
      { text: "Add a task that will take 2 hours", intent: "create_task" },
      
      // Update task examples
      { text: "Update the task status", intent: "update_task" },
      { text: "Change task priority to high", intent: "update_task" },
      { text: "Mark task as completed", intent: "update_task" },
      { text: "Modify the deadline for task", intent: "update_task" },
      { text: "Update task description", intent: "update_task" },
      { text: "Change the due date of my task", intent: "update_task" },
      { text: "Edit task details", intent: "update_task" },
      { text: "Update the task title", intent: "update_task" },
      { text: "Change task from medium to high priority", intent: "update_task" },
      { text: "Extend the deadline of my task", intent: "update_task" },
      { text: "Update task progress to 50%", intent: "update_task" },
      { text: "Change the estimated hours for task", intent: "update_task" },
      { text: "Update task category", intent: "update_task" },
      { text: "Mark this task as blocked", intent: "update_task" },
      { text: "Change task status to in progress", intent: "update_task" },
      
      // Delete task examples
      { text: "Delete this task", intent: "delete_task" },
      { text: "Remove task from my list", intent: "delete_task" },
      { text: "I want to delete a task", intent: "delete_task" },
      { text: "Remove the completed task", intent: "delete_task" },
      { text: "Delete task about documentation", intent: "delete_task" },
      { text: "Remove all completed tasks", intent: "delete_task" },
      { text: "Delete the task I created yesterday", intent: "delete_task" },
      { text: "I need to remove a duplicate task", intent: "delete_task" },
      { text: "Delete task with ID 12345", intent: "delete_task" },
      { text: "Remove the low priority tasks", intent: "delete_task" },
      { text: "Delete tasks older than 3 months", intent: "delete_task" },
      { text: "Remove task assigned to me", intent: "delete_task" },
      { text: "Delete all tasks in project X", intent: "delete_task" },
      { text: "Remove tasks with no deadline", intent: "delete_task" },
      { text: "Delete the cancelled task", intent: "delete_task" },
      
      // Search task examples
      { text: "Find tasks due today", intent: "search_task" },
      { text: "Search for high priority tasks", intent: "search_task" },
      { text: "Look for tasks assigned to me", intent: "search_task" },
      { text: "Find tasks about documentation", intent: "search_task" },
      { text: "Search tasks in project X", intent: "search_task" },
      { text: "Find overdue tasks", intent: "search_task" },
      { text: "Search for tasks created last week", intent: "search_task" },
      { text: "Find tasks with no assignee", intent: "search_task" },
      { text: "Look for completed tasks", intent: "search_task" },
      { text: "Search tasks by keyword", intent: "search_task" },
      { text: "Find tasks related to frontend", intent: "search_task" },
      { text: "Search for blocked tasks", intent: "search_task" },
      { text: "Find tasks due this month", intent: "search_task" },
      { text: "Look for tasks with attachments", intent: "search_task" },
      { text: "Search for recently updated tasks", intent: "search_task" },
      
      // Schedule meeting examples
      { text: "Schedule a meeting for tomorrow", intent: "schedule_meeting" },
      { text: "Set up a meeting with the team", intent: "schedule_meeting" },
      { text: "Create a meeting at 2pm", intent: "schedule_meeting" },
      { text: "Schedule a call with client", intent: "schedule_meeting" },
      { text: "Book a meeting room for 3pm", intent: "schedule_meeting" },
      { text: "Set up weekly standup meeting", intent: "schedule_meeting" },
      { text: "Schedule project review for next week", intent: "schedule_meeting" },
      { text: "Create a meeting invitation", intent: "schedule_meeting" },
      { text: "Book time with @john and @sarah", intent: "schedule_meeting" },
      { text: "Schedule a 1-hour meeting", intent: "schedule_meeting" },
      { text: "Set up video conference for tomorrow", intent: "schedule_meeting" },
      { text: "Create recurring meeting every Monday", intent: "schedule_meeting" },
      { text: "Schedule interview with candidate", intent: "schedule_meeting" },
      { text: "Book a meeting for sprint planning", intent: "schedule_meeting" },
      { text: "Set up a quick 15-minute sync", intent: "schedule_meeting" },
      
      // Set reminder examples
      { text: "Remind me about the meeting", intent: "set_reminder" },
      { text: "Set a reminder for tomorrow", intent: "set_reminder" },
      { text: "Remind me to call client at 3pm", intent: "set_reminder" },
      { text: "Create a reminder for deadline", intent: "set_reminder" },
      { text: "Set reminder for project submission", intent: "set_reminder" },
      { text: "Remind me to follow up next week", intent: "set_reminder" },
      { text: "Set an alert for 5pm today", intent: "set_reminder" },
      { text: "Create a reminder to check emails", intent: "set_reminder" },
      { text: "Remind me about the task tomorrow", intent: "set_reminder" },
      { text: "Set a reminder for the presentation", intent: "set_reminder" },
      { text: "Create daily reminder for standup", intent: "set_reminder" },
      { text: "Remind me to update status report", intent: "set_reminder" },
      { text: "Set reminder for medication at 8am", intent: "set_reminder" },
      { text: "Create reminder for team meeting", intent: "set_reminder" },
      { text: "Remind me to send invoice next Monday", intent: "set_reminder" },
      
      // Generate report examples
      { text: "Generate a report of all tasks", intent: "generate_report" },
      { text: "Create project status report", intent: "generate_report" },
      { text: "I need a report on team performance", intent: "generate_report" },
      { text: "Generate time tracking report", intent: "generate_report" },
      { text: "Create report for completed tasks", intent: "generate_report" },
      { text: "Generate weekly progress report", intent: "generate_report" },
      { text: "Create a report for client meeting", intent: "generate_report" },
      { text: "Generate productivity metrics", intent: "generate_report" },
      { text: "Create report of overdue tasks", intent: "generate_report" },
      { text: "Generate resource allocation report", intent: "generate_report" },
      { text: "Create report for #frontend project", intent: "generate_report" },
      { text: "Generate report of this month's activities", intent: "generate_report" },
      { text: "Create summary report for management", intent: "generate_report" },
      { text: "Generate burndown chart for sprint", intent: "generate_report" },
      { text: "Create report showing task distribution", intent: "generate_report" },
      
      // Assign task examples
      { text: "Assign this task to John", intent: "assign_task" },
      { text: "Give this task to the design team", intent: "assign_task" },
      { text: "Assign bug fix to @sarah", intent: "assign_task" },
      { text: "Make Tom responsible for this task", intent: "assign_task" },
      { text: "Assign project to new team member", intent: "assign_task" },
      { text: "Change task assignee to @mike", intent: "assign_task" },
      { text: "Reassign task from John to Sarah", intent: "assign_task" },
      { text: "Assign all documentation tasks to @emma", intent: "assign_task" },
      { text: "Make QA team responsible for testing", intent: "assign_task" },
      { text: "Assign high priority tasks to senior devs", intent: "assign_task" },
      { text: "Give this to someone with React experience", intent: "assign_task" },
      { text: "Assign task to available team member", intent: "assign_task" },
      { text: "Make @john and @sarah co-owners", intent: "assign_task" },
      { text: "Assign this task to myself", intent: "assign_task" },
      { text: "Give backend tasks to the server team", intent: "assign_task" }
    ]
  };
}
