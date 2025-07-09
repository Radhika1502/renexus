export interface AITaskInsights {
  suggestions: string[];
  similarTasks: string[];
  potentialRisks: string[];
}

export interface AICommentSuggestion {
  content: string;
  tone: 'professional' | 'friendly' | 'direct';
}
