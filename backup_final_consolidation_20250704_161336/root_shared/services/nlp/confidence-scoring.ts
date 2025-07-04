/**
 * Confidence Scoring System
 * Provides mechanisms to calculate and manage confidence scores for NLP predictions
 */

// Types of inputs for confidence scoring
export type ConfidenceInputType = 
  | 'intent-classification' 
  | 'entity-extraction' 
  | 'sentiment-analysis'
  | 'task-suggestion'
  | 'workflow-prediction'
  | 'anomaly-detection';

// Confidence scoring factors
export interface ConfidenceFactor {
  name: string;
  weight: number;
  value: number;  // 0-1 scale
  description: string;
}

// Confidence score with detailed factors
export interface ConfidenceScore {
  score: number;      // 0-1 scale
  threshold: number;  // Minimum acceptable confidence 
  factors: ConfidenceFactor[];
  explanation: string[];
  timestamp: Date;
  inputType: ConfidenceInputType;
  calculationMethod: string;
}

/**
 * Confidence scoring service for NLP predictions
 */
export class ConfidenceScorer {
  private thresholds: Map<ConfidenceInputType, number> = new Map();
  private factorWeights: Map<ConfidenceInputType, Map<string, number>> = new Map();
  
  constructor() {
    this.initializeDefaults();
  }
  
  /**
   * Initialize default thresholds and factor weights
   */
  private initializeDefaults(): void {
    // Default confidence thresholds by input type
    this.thresholds.set('intent-classification', 0.7);
    this.thresholds.set('entity-extraction', 0.65);
    this.thresholds.set('sentiment-analysis', 0.6);
    this.thresholds.set('task-suggestion', 0.75);
    this.thresholds.set('workflow-prediction', 0.8);
    this.thresholds.set('anomaly-detection', 0.85);
    
    // Default factor weights for intent classification
    const intentFactors = new Map<string, number>();
    intentFactors.set('patternMatch', 0.4);
    intentFactors.set('keywordPresence', 0.3);
    intentFactors.set('contextRelevance', 0.2);
    intentFactors.set('userHistory', 0.1);
    this.factorWeights.set('intent-classification', intentFactors);
    
    // Default factor weights for entity extraction
    const entityFactors = new Map<string, number>();
    entityFactors.set('patternStrength', 0.5);
    entityFactors.set('contextMatch', 0.3);
    entityFactors.set('dictionaryPresence', 0.2);
    this.factorWeights.set('entity-extraction', entityFactors);
    
    // Default factor weights for sentiment analysis
    const sentimentFactors = new Map<string, number>();
    sentimentFactors.set('wordStrength', 0.4);
    sentimentFactors.set('patternConsistency', 0.3);
    sentimentFactors.set('contextClarity', 0.3);
    this.factorWeights.set('sentiment-analysis', sentimentFactors);
    
    // Default factor weights for task suggestions
    const taskSuggestionFactors = new Map<string, number>();
    taskSuggestionFactors.set('userBehaviorMatch', 0.4);
    taskSuggestionFactors.set('contextRelevance', 0.3);
    taskSuggestionFactors.set('historicalAcceptance', 0.2);
    taskSuggestionFactors.set('timeRelevance', 0.1);
    this.factorWeights.set('task-suggestion', taskSuggestionFactors);
  }
  
  /**
   * Get the confidence threshold for an input type
   * @param inputType Type of NLP prediction
   * @returns Confidence threshold
   */
  public getThreshold(inputType: ConfidenceInputType): number {
    return this.thresholds.get(inputType) || 0.7; // Default threshold
  }
  
  /**
   * Set a custom confidence threshold for an input type
   * @param inputType Type of NLP prediction
   * @param threshold New threshold value (0-1)
   */
  public setThreshold(inputType: ConfidenceInputType, threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Confidence threshold must be between 0 and 1');
    }
    
    this.thresholds.set(inputType, threshold);
  }
  
  /**
   * Calculate a weighted confidence score from factors
   * @param inputType Type of NLP prediction
   * @param factors Confidence factors with values
   * @returns Confidence score object
   */
  public calculateScore(
    inputType: ConfidenceInputType,
    factors: { name: string; value: number; description: string }[]
  ): ConfidenceScore {
    if (factors.length === 0) {
      throw new Error('At least one confidence factor is required');
    }
    
    const factorWeightMap = this.factorWeights.get(inputType);
    
    if (!factorWeightMap) {
      throw new Error(`No factor weights defined for input type: ${inputType}`);
    }
    
    let totalScore = 0;
    let totalWeight = 0;
    const scoredFactors: ConfidenceFactor[] = [];
    const explanations: string[] = [];
    
    // Calculate weighted score
    for (const factor of factors) {
      // Get weight for this factor
      const weight = factorWeightMap.get(factor.name) || 0;
      
      // Skip factors with zero weight
      if (weight === 0) {
        continue;
      }
      
      // Ensure factor value is in valid range
      const value = Math.max(0, Math.min(1, factor.value));
      
      // Calculate weighted factor score
      const weightedScore = value * weight;
      totalScore += weightedScore;
      totalWeight += weight;
      
      // Record factor details
      scoredFactors.push({
        name: factor.name,
        weight,
        value,
        description: factor.description
      });
      
      // Add explanation
      const contribution = (weightedScore / weight) * 100;
      explanations.push(
        `${factor.name}: ${value.toFixed(2)} * ${weight} weight = ${contribution.toFixed(1)}% contribution`
      );
    }
    
    // Calculate final score
    let finalScore = 0;
    if (totalWeight > 0) {
      finalScore = totalScore / totalWeight;
    }
    
    // Get threshold for this input type
    const threshold = this.getThreshold(inputType);
    
    // Add threshold explanation
    if (finalScore >= threshold) {
      explanations.push(
        `Final score ${finalScore.toFixed(2)} meets or exceeds threshold ${threshold}`
      );
    } else {
      explanations.push(
        `Final score ${finalScore.toFixed(2)} is below threshold ${threshold}`
      );
    }
    
    return {
      score: finalScore,
      threshold,
      factors: scoredFactors,
      explanation: explanations,
      timestamp: new Date(),
      inputType,
      calculationMethod: 'weighted-average'
    };
  }
  
  /**
   * Determine if a confidence score passes the threshold
   * @param score Confidence score to check
   * @returns Boolean indicating if confidence is sufficient
   */
  public isConfident(score: ConfidenceScore): boolean {
    return score.score >= score.threshold;
  }
  
  /**
   * Get confidence level label
   * @param score Confidence score
   * @returns Text label for confidence level
   */
  public getConfidenceLevel(score: number): string {
    if (score >= 0.9) {
      return 'very high';
    } else if (score >= 0.75) {
      return 'high';
    } else if (score >= 0.6) {
      return 'moderate';
    } else if (score >= 0.4) {
      return 'low';
    } else {
      return 'very low';
    }
  }
  
  /**
   * Format confidence score for display
   * @param score Confidence score
   * @returns Formatted display string
   */
  public formatConfidence(score: number): string {
    const percentage = Math.round(score * 100);
    const level = this.getConfidenceLevel(score);
    return `${percentage}% (${level})`;
  }
}

/**
 * Intent confidence calculator for intent classification
 */
export class IntentConfidenceCalculator {
  private confidenceScorer: ConfidenceScorer;
  
  /**
   * Constructor with confidence scorer
   * @param scorer Confidence scorer instance
   */
  constructor(scorer?: ConfidenceScorer) {
    this.confidenceScorer = scorer || new ConfidenceScorer();
  }
  
  /**
   * Calculate intent confidence from pattern match score and context
   * @param patternMatchScore Pattern matching score
   * @param keywordPresence Keyword presence score
   * @param contextRelevance Context relevance score
   * @param userHistoryMatch User history match score
   * @returns Confidence score
   */
  public calculateIntentConfidence(
    patternMatchScore: number,
    keywordPresence: number,
    contextRelevance: number,
    userHistoryMatch: number
  ): ConfidenceScore {
    return this.confidenceScorer.calculateScore(
      'intent-classification',
      [
        {
          name: 'patternMatch',
          value: patternMatchScore,
          description: 'Strength of pattern match for this intent'
        },
        {
          name: 'keywordPresence',
          value: keywordPresence,
          description: 'Presence of intent-specific keywords'
        },
        {
          name: 'contextRelevance',
          value: contextRelevance,
          description: 'Relevance to current user context'
        },
        {
          name: 'userHistory',
          value: userHistoryMatch,
          description: 'Match to user\'s historical intent patterns'
        }
      ]
    );
  }
}

/**
 * Entity confidence calculator for entity extraction
 */
export class EntityConfidenceCalculator {
  private confidenceScorer: ConfidenceScorer;
  
  /**
   * Constructor with confidence scorer
   * @param scorer Confidence scorer instance
   */
  constructor(scorer?: ConfidenceScorer) {
    this.confidenceScorer = scorer || new ConfidenceScorer();
  }
  
  /**
   * Calculate entity confidence from pattern strength and context
   * @param patternStrength Pattern strength score
   * @param contextMatch Context match score
   * @param dictionaryPresence Dictionary presence score
   * @returns Confidence score
   */
  public calculateEntityConfidence(
    patternStrength: number,
    contextMatch: number,
    dictionaryPresence: number
  ): ConfidenceScore {
    return this.confidenceScorer.calculateScore(
      'entity-extraction',
      [
        {
          name: 'patternStrength',
          value: patternStrength,
          description: 'Strength of regex or pattern match'
        },
        {
          name: 'contextMatch',
          value: contextMatch,
          description: 'Match to expected entity context'
        },
        {
          name: 'dictionaryPresence',
          value: dictionaryPresence,
          description: 'Presence in reference dictionary'
        }
      ]
    );
  }
}

// Export singleton instances
let confidenceScorer: ConfidenceScorer | null = null;
let intentConfidenceCalculator: IntentConfidenceCalculator | null = null;
let entityConfidenceCalculator: EntityConfidenceCalculator | null = null;

/**
 * Get the singleton confidence scorer instance
 * @returns Confidence scorer instance
 */
export function getConfidenceScorer(): ConfidenceScorer {
  if (!confidenceScorer) {
    confidenceScorer = new ConfidenceScorer();
  }
  
  return confidenceScorer;
}

/**
 * Get the singleton intent confidence calculator instance
 * @returns Intent confidence calculator instance
 */
export function getIntentConfidenceCalculator(): IntentConfidenceCalculator {
  if (!intentConfidenceCalculator) {
    intentConfidenceCalculator = new IntentConfidenceCalculator(getConfidenceScorer());
  }
  
  return intentConfidenceCalculator;
}

/**
 * Get the singleton entity confidence calculator instance
 * @returns Entity confidence calculator instance
 */
export function getEntityConfidenceCalculator(): EntityConfidenceCalculator {
  if (!entityConfidenceCalculator) {
    entityConfidenceCalculator = new EntityConfidenceCalculator(getConfidenceScorer());
  }
  
  return entityConfidenceCalculator;
}
