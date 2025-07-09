import { useState, useCallback } from 'react';
import { Task  } from "../../../shared/types/task";
import AIEnhancementService from '../services/ai/AIEnhancementService';

/**
 * Hook for integrating AI enhancements into React components
 */
const useAIEnhancements = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const aiService = AIEnhancementService.getInstance();
  
  /**
   * Extract keywords from text
   */
  const extractKeywords = useCallback(async (text: string): Promise<string[]> => {
    setIsProcessing(true);
    try {
      // Add artificial delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 300));
      const keywords = aiService.extractKeywords(text);
      return keywords;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  /**
   * Suggest category for a task based on its description
   */
  const suggestCategory = useCallback(async (description: string): Promise<string> => {
    setIsProcessing(true);
    try {
      // Add artificial delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 500));
      const category = aiService.suggestCategory(description);
      return category;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  /**
   * Estimate task completion time
   */
  const estimateTaskTime = useCallback(async (description: string, similarTasks: Task[]): Promise<number> => {
    setIsProcessing(true);
    try {
      // Add artificial delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 700));
      const estimatedHours = aiService.estimateTaskTime(description, similarTasks);
      return estimatedHours;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  /**
   * Detect potential task dependencies
   */
  const detectDependencies = useCallback(async (task: Task, allTasks: Task[]): Promise<Task[]> => {
    setIsProcessing(true);
    try {
      // Add artificial delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 600));
      const dependencies = aiService.detectDependencies(task, allTasks);
      return dependencies;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  /**
   * Optimize workload distribution
   */
  const optimizeWorkload = useCallback(async (
    tasks: Task[], 
    users: { id: string; capacity: number }[]
  ): Promise<Map<string, Task[]>> => {
    setIsProcessing(true);
    try {
      // Add artificial delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      const optimizedWorkload = aiService.optimizeWorkload(tasks, users);
      return optimizedWorkload;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  /**
   * Detect anomalies in task data
   */
  const detectAnomalies = useCallback(async (tasks: Task[]): Promise<{ task: Task; reason: string }[]> => {
    setIsProcessing(true);
    try {
      // Add artificial delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 800));
      const anomalies = aiService.detectAnomalies(tasks);
      return anomalies;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  return {
    isProcessing,
    extractKeywords,
    suggestCategory,
    estimateTaskTime,
    detectDependencies,
    optimizeWorkload,
    detectAnomalies
  };
};

export default useAIEnhancements;

