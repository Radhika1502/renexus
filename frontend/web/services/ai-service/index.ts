import axios from '../axios';
import { AITaskInsights } from './types';

export const getAITaskInsights = async (taskId: string, description: string): Promise<AITaskInsights> => {
  try {
    const response = await axios.post('/api/ai/task-insights', { taskId, description });
    return response.data;
  } catch (error) {
    console.error('Failed to get AI insights:', error);
    return {
      suggestions: [],
      similarTasks: [],
      potentialRisks: []
    };
  }
};

// Add more AI service functions as needed
