/**
 * Format a date string to a more readable format
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "Jun 23, 2025")
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

/**
 * Format a date-time string to a more readable format with time
 * @param dateTimeString ISO date-time string
 * @returns Formatted date-time string (e.g., "Jun 23, 2025, 5:30 PM")
 */
export const formatDateTime = (dateTimeString: string): string => {
  if (!dateTimeString) return '';
  
  const date = new Date(dateTimeString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
};

/**
 * Generate a project key from a project name
 * @param name Project name
 * @returns Project key (e.g., "PROJ" from "Project Management")
 */
export const generateProjectKey = (name: string): string => {
  if (!name) return '';
  
  // Split the name into words
  const words = name.split(' ');
  
  // For a single word, take the first 4 letters
  if (words.length === 1) {
    return words[0].substring(0, 4).toUpperCase();
  }
  
  // For multiple words, take the first letter of each word (up to 4)
  return words
    .slice(0, 4)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();
};

/**
 * Calculate project progress based on completed tasks
 * @param totalTasks Total number of tasks
 * @param completedTasks Number of completed tasks
 * @returns Progress percentage (0-100)
 */
export const calculateProgress = (totalTasks: number, completedTasks: number): number => {
  if (totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
};
