import { Task } from '../../types/task';

/**
 * AIEnhancementService
 * 
 * Service for AI-powered enhancements to task management
 */
class AIEnhancementService {
  private static instance: AIEnhancementService;
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): AIEnhancementService {
    if (!AIEnhancementService.instance) {
      AIEnhancementService.instance = new AIEnhancementService();
    }
    return AIEnhancementService.instance;
  }
  
  /**
   * Extract keywords from task description
   */
  public extractKeywords(text: string): string[] {
    // In a real implementation, this would use NLP to extract keywords
    // For now, use a simple approach
    if (!text) return [];
    
    const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as'];
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    
    // Filter out stop words and short words
    const filteredWords = words.filter(word => 
      word.length > 2 && !stopWords.includes(word)
    );
    
    // Count word frequencies
    const wordFrequency: Record<string, number> = {};
    filteredWords.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
    
    // Sort by frequency and take top 5
    return Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }
  
  /**
   * Suggest task category based on description
   */
  public suggestCategory(description: string): string {
    // In a real implementation, this would use ML classification
    // For now, use keyword matching
    const keywords = this.extractKeywords(description);
    const text = description.toLowerCase();
    
    const categoryPatterns = [
      { category: 'Development', keywords: ['code', 'develop', 'implement', 'bug', 'feature', 'test', 'fix', 'programming'] },
      { category: 'Design', keywords: ['design', 'ui', 'ux', 'wireframe', 'mockup', 'prototype', 'visual', 'layout'] },
      { category: 'Documentation', keywords: ['document', 'write', 'update', 'manual', 'guide', 'readme', 'wiki'] },
      { category: 'Meeting', keywords: ['meet', 'call', 'discuss', 'sync', 'review', 'presentation', 'demo'] },
      { category: 'Planning', keywords: ['plan', 'strategy', 'roadmap', 'prioritize', 'schedule', 'organize'] },
      { category: 'Research', keywords: ['research', 'analyze', 'investigate', 'explore', 'study', 'evaluate'] }
    ];
    
    // Score each category
    const scores = categoryPatterns.map(pattern => {
      let score = 0;
      
      // Check for exact keyword matches
      pattern.keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          score += 2;
        }
      });
      
      // Check for extracted keywords
      keywords.forEach(keyword => {
        if (pattern.keywords.some(k => k.includes(keyword) || keyword.includes(k))) {
          score += 1;
        }
      });
      
      return { category: pattern.category, score };
    });
    
    // Return highest scoring category or 'Other' if no good match
    const bestMatch = scores.sort((a, b) => b.score - a.score)[0];
    return bestMatch.score > 0 ? bestMatch.category : 'Other';
  }
  
  /**
   * Estimate task completion time based on description and similar tasks
   */
  public estimateTaskTime(description: string, similarTasks: Task[]): number {
    // In a real implementation, this would use ML regression
    // For now, use a simple heuristic approach
    
    // Base estimate on word count
    const wordCount = description.split(/\s+/).length;
    let baseEstimate = 0;
    
    if (wordCount < 10) {
      baseEstimate = 1; // 1 hour for very short descriptions
    } else if (wordCount < 30) {
      baseEstimate = 2; // 2 hours for short descriptions
    } else if (wordCount < 60) {
      baseEstimate = 4; // 4 hours for medium descriptions
    } else {
      baseEstimate = 8; // 8 hours for long descriptions
    }
    
    // Adjust based on similar completed tasks if available
    const completedSimilarTasks = similarTasks.filter(task => 
      task.status === 'done' && task.actualHours !== undefined
    );
    
    if (completedSimilarTasks.length > 0) {
      const avgActualHours = completedSimilarTasks.reduce(
        (sum, task) => sum + (task.actualHours || 0), 
        0
      ) / completedSimilarTasks.length;
      
      // Blend base estimate with historical data
      return Math.round((baseEstimate + avgActualHours * 2) / 3);
    }
    
    return baseEstimate;
  }
  
  /**
   * Detect task dependencies based on description
   */
  public detectDependencies(task: Task, allTasks: Task[]): Task[] {
    // In a real implementation, this would use NLP to detect dependency phrases
    // For now, use a simple keyword approach
    
    if (!task.description) return [];
    
    const description = task.description.toLowerCase();
    const dependencyPhrases = [
      'after', 'depends on', 'following', 'once', 'requires', 'waiting for',
      'blocked by', 'dependent on', 'prerequisite', 'blocker'
    ];
    
    // Check if any dependency phrases exist
    const hasDependencyPhrase = dependencyPhrases.some(phrase => 
      description.includes(phrase)
    );
    
    if (!hasDependencyPhrase) return [];
    
    // Find potential dependencies by looking for task titles in the description
    return allTasks.filter(otherTask => 
      otherTask.id !== task.id && 
      otherTask.title && 
      description.includes(otherTask.title.toLowerCase())
    );
  }
  
  /**
   * Optimize workload distribution across team members
   */
  public optimizeWorkload(tasks: Task[], users: { id: string; capacity: number }[]): Map<string, Task[]> {
    // In a real implementation, this would use a sophisticated algorithm
    // For now, use a simple greedy approach
    
    // Create a map to store assigned tasks for each user
    const userAssignments = new Map<string, Task[]>();
    const userWorkloads = new Map<string, number>();
    
    // Initialize maps
    users.forEach(user => {
      userAssignments.set(user.id, []);
      userWorkloads.set(user.id, 0);
    });
    
    // Sort tasks by priority (high to low) and estimated hours (high to low)
    const sortedTasks = [...tasks].sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by estimated hours (descending)
      return (b.estimatedHours || 0) - (a.estimatedHours || 0);
    });
    
    // Assign tasks to users with lowest current workload
    sortedTasks.forEach(task => {
      // Skip already assigned tasks
      if (task.assigneeId) return;
      
      // Find user with lowest workload
      let minWorkload = Number.MAX_VALUE;
      let minWorkloadUserId = '';
      
      userWorkloads.forEach((workload, userId) => {
        if (workload < minWorkload) {
          minWorkload = workload;
          minWorkloadUserId = userId;
        }
      });
      
      // Assign task to user
      if (minWorkloadUserId) {
        const userTasks = userAssignments.get(minWorkloadUserId) || [];
        userTasks.push(task);
        userAssignments.set(minWorkloadUserId, userTasks);
        
        // Update workload
        const newWorkload = minWorkload + (task.estimatedHours || 0);
        userWorkloads.set(minWorkloadUserId, newWorkload);
      }
    });
    
    return userAssignments;
  }
  
  /**
   * Detect anomalies in task data
   */
  public detectAnomalies(tasks: Task[]): { task: Task; reason: string }[] {
    const anomalies: { task: Task; reason: string }[] = [];
    
    // Calculate average estimated and actual hours
    const completedTasks = tasks.filter(t => t.status === 'done' && t.estimatedHours && t.actualHours);
    
    if (completedTasks.length < 5) {
      return anomalies; // Not enough data for reliable anomaly detection
    }
    
    const avgEstimatedHours = completedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0) / completedTasks.length;
    const avgActualHours = completedTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0) / completedTasks.length;
    
    // Calculate standard deviations
    const estimatedStdDev = Math.sqrt(
      completedTasks.reduce((sum, t) => sum + Math.pow((t.estimatedHours || 0) - avgEstimatedHours, 2), 0) / completedTasks.length
    );
    
    const actualStdDev = Math.sqrt(
      completedTasks.reduce((sum, t) => sum + Math.pow((t.actualHours || 0) - avgActualHours, 2), 0) / completedTasks.length
    );
    
    // Check for anomalies
    tasks.forEach(task => {
      // Anomaly: Significantly underestimated task
      if (task.status === 'done' && task.estimatedHours && task.actualHours) {
        if (task.actualHours > task.estimatedHours * 2 && 
            task.actualHours > avgActualHours + 2 * actualStdDev) {
          anomalies.push({
            task,
            reason: 'Significantly underestimated task time'
          });
        }
      }
      
      // Anomaly: Task with no progress for a long time
      if (task.status === 'in_progress' && task.updatedAt) {
        const daysSinceUpdate = (Date.now() - new Date(task.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate > 7) {
          anomalies.push({
            task,
            reason: `No progress for ${Math.floor(daysSinceUpdate)} days`
          });
        }
      }
      
      // Anomaly: Overdue high priority task
      if (task.priority === 'high' && task.dueDate && task.status !== 'done') {
        const dueDate = new Date(task.dueDate);
        if (dueDate < new Date()) {
          anomalies.push({
            task,
            reason: 'Overdue high priority task'
          });
        }
      }
    });
    
    return anomalies;
  }
}

export default AIEnhancementService;
