/**
 * Intent Recognition System for Renexus NLP capabilities
 * Provides functionality to analyze user input and identify intents
 */

import { TrainingData } from './training-data';

// Intent types supported by the system
export type IntentType = 
  | 'create_task'
  | 'update_task'
  | 'delete_task'
  | 'search_task'
  | 'schedule_meeting'
  | 'set_reminder'
  | 'generate_report'
  | 'assign_task'
  | 'unknown';

// Entity extracted from user input
export interface Entity {
  type: string;
  value: string;
  startPosition: number;
  endPosition: number;
  confidence: number;
}

// Result of intent recognition
export interface IntentRecognitionResult {
  intent: IntentType;
  confidence: number;
  entities: Entity[];
  originalText: string;
}

// Classification model for intent recognition
class IntentClassificationModel {
  private trainingData: TrainingData;
  private keywordMap: Map<string, Map<IntentType, number>>;
  private intentPriors: Map<IntentType, number>;

  constructor(trainingData: TrainingData) {
    this.trainingData = trainingData;
    this.keywordMap = new Map();
    this.intentPriors = new Map();
    this.train();
  }

  /**
   * Train the model using the provided training data
   */
  private train(): void {
    // Count occurrences of each intent
    const intentCounts = new Map<IntentType, number>();
    let totalExamples = 0;

    // Process each training example
    this.trainingData.examples.forEach(example => {
      totalExamples++;
      
      // Update intent counts for priors
      const count = intentCounts.get(example.intent) || 0;
      intentCounts.set(example.intent, count + 1);
      
      // Process text for keywords
      const words = this.tokenize(example.text.toLowerCase());
      
      words.forEach(word => {
        if (!this.keywordMap.has(word)) {
          this.keywordMap.set(word, new Map());
        }
        
        const intentMap = this.keywordMap.get(word)!;
        const wordCount = intentMap.get(example.intent) || 0;
        intentMap.set(example.intent, wordCount + 1);
      });
    });
    
    // Calculate prior probabilities
    intentCounts.forEach((count, intent) => {
      this.intentPriors.set(intent, count / totalExamples);
    });
    
    console.log(`Intent recognition model trained with ${totalExamples} examples`);
  }

  /**
   * Classify text to determine the most likely intent
   * @param text The text to classify
   * @returns The recognized intent and confidence score
   */
  public classify(text: string): { intent: IntentType, confidence: number } {
    const words = this.tokenize(text.toLowerCase());
    const scores = new Map<IntentType, number>();
    
    // Initialize scores with priors
    this.intentPriors.forEach((prior, intent) => {
      scores.set(intent, Math.log(prior)); // Use log for numerical stability
    });
    
    // Calculate scores based on word occurrences
    words.forEach(word => {
      if (this.keywordMap.has(word)) {
        const intentMap = this.keywordMap.get(word)!;
        
        intentMap.forEach((count, intent) => {
          const currentScore = scores.get(intent) || 0;
          // Simple Naive Bayes-inspired approach
          scores.set(intent, currentScore + Math.log(count + 1));
        });
      }
    });
    
    // Find intent with highest score
    let maxScore = Number.NEGATIVE_INFINITY;
    let bestIntent: IntentType = 'unknown';
    
    scores.forEach((score, intent) => {
      if (score > maxScore) {
        maxScore = score;
        bestIntent = intent;
      }
    });
    
    // Convert to probability-like confidence (0-1)
    let totalExp = 0;
    scores.forEach(score => {
      totalExp += Math.exp(score);
    });
    
    const confidence = Math.exp(maxScore) / totalExp;
    
    return {
      intent: bestIntent,
      confidence
    };
  }

  /**
   * Simple tokenization of text into words
   * @param text Text to tokenize
   * @returns Array of tokens
   */
  private tokenize(text: string): string[] {
    // Remove punctuation and split by whitespace
    return text
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }
}

/**
 * Entity extraction from user input
 */
class EntityExtractor {
  private entityPatterns: Map<string, RegExp>;
  
  constructor() {
    this.entityPatterns = new Map([
      ['date', /\b(today|tomorrow|yesterday|next week|next month|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4})\b/gi],
      ['time', /\b(\d{1,2}:\d{2}(?:am|pm)?|\d{1,2}(?:am|pm))\b/gi],
      ['priority', /\b(high|medium|low|urgent|critical)\s+priority\b/gi],
      ['person', /\b@([a-z0-9_]+)\b/gi],
      ['project', /\b#([a-z0-9_]+)\b/gi],
      ['duration', /\b(\d+)\s+(hour|minute|day|week|month)s?\b/gi]
    ]);
  }
  
  /**
   * Extract entities from text
   * @param text Text to extract entities from
   * @returns Array of extracted entities
   */
  public extract(text: string): Entity[] {
    const entities: Entity[] = [];
    
    this.entityPatterns.forEach((pattern, entityType) => {
      let match;
      pattern.lastIndex = 0; // Reset regex state
      
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: entityType,
          value: match[0],
          startPosition: match.index,
          endPosition: match.index + match[0].length,
          confidence: 0.9 // Fixed confidence for now
        });
      }
    });
    
    return entities;
  }
}

/**
 * Main intent recognition service
 */
export class IntentRecognitionService {
  private model: IntentClassificationModel;
  private entityExtractor: EntityExtractor;
  
  constructor(trainingData: TrainingData) {
    this.model = new IntentClassificationModel(trainingData);
    this.entityExtractor = new EntityExtractor();
  }
  
  /**
   * Recognize intent from user input
   * @param text User input text
   * @returns Intent recognition result
   */
  public recognizeIntent(text: string): IntentRecognitionResult {
    // Classify the intent
    const { intent, confidence } = this.model.classify(text);
    
    // Extract entities
    const entities = this.entityExtractor.extract(text);
    
    return {
      intent,
      confidence,
      entities,
      originalText: text
    };
  }
  
  /**
   * Process recognized intent and execute corresponding action
   * @param result Intent recognition result
   * @returns Response to the user
   */
  public async processIntent(result: IntentRecognitionResult): Promise<string> {
    // Minimum confidence threshold
    if (result.confidence < 0.4) {
      return "I'm not sure what you want to do. Could you please rephrase?";
    }
    
    // Process based on intent type
    switch (result.intent) {
      case 'create_task':
        return this.handleCreateTask(result);
      case 'update_task':
        return this.handleUpdateTask(result);
      case 'search_task':
        return this.handleSearchTask(result);
      case 'schedule_meeting':
        return this.handleScheduleMeeting(result);
      case 'set_reminder':
        return this.handleSetReminder(result);
      case 'generate_report':
        return this.handleGenerateReport(result);
      case 'assign_task':
        return this.handleAssignTask(result);
      default:
        return "I'm not sure how to help with that yet.";
    }
  }
  
  // Intent handlers
  private handleCreateTask(result: IntentRecognitionResult): string {
    // Extract task details from entities
    const priority = result.entities.find(e => e.type === 'priority')?.value || 'medium';
    const date = result.entities.find(e => e.type === 'date')?.value;
    const project = result.entities.find(e => e.type === 'project')?.value;
    
    // In a real implementation, this would create a task in the database
    return `I've created a new task with ${priority} priority${date ? ` due on ${date}` : ''}${project ? ` in project ${project}` : ''}.`;
  }
  
  private handleUpdateTask(result: IntentRecognitionResult): string {
    return "I'll update that task for you.";
  }
  
  private handleSearchTask(result: IntentRecognitionResult): string {
    return "Here are the tasks that match your search.";
  }
  
  private handleScheduleMeeting(result: IntentRecognitionResult): string {
    const date = result.entities.find(e => e.type === 'date')?.value || 'today';
    const time = result.entities.find(e => e.type === 'time')?.value || 'now';
    const people = result.entities.filter(e => e.type === 'person').map(e => e.value);
    
    return `I've scheduled a meeting for ${date} at ${time}${people.length > 0 ? ` with ${people.join(', ')}` : ''}.`;
  }
  
  private handleSetReminder(result: IntentRecognitionResult): string {
    const date = result.entities.find(e => e.type === 'date')?.value || 'today';
    const time = result.entities.find(e => e.type === 'time')?.value || 'in 1 hour';
    
    return `I've set a reminder for ${date} at ${time}.`;
  }
  
  private handleGenerateReport(result: IntentRecognitionResult): string {
    const project = result.entities.find(e => e.type === 'project')?.value;
    
    return `Generating a report${project ? ` for ${project}` : ''}.`;
  }
  
  private handleAssignTask(result: IntentRecognitionResult): string {
    const person = result.entities.find(e => e.type === 'person')?.value;
    
    return `Task assigned to ${person || 'the specified user'}.`;
  }
}

// Export a singleton instance
let intentService: IntentRecognitionService | null = null;

export function getIntentRecognitionService(): IntentRecognitionService {
  if (!intentService) {
    // Import training data and initialize the service
    const trainingData = require('./training-data').getTrainingData();
    intentService = new IntentRecognitionService(trainingData);
  }
  
  return intentService;
}
