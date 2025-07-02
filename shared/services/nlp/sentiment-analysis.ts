/**
 * Sentiment Analysis Service
 * Provides sentiment detection and analysis capabilities for text inputs
 */

// Sentiment result interface
export interface SentimentResult {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: {
    positive: number;
    negative: number;
    neutral: number;
  };
  confidence: number;
  language: string;
  sentences?: Array<{
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    score: {
      positive: number;
      negative: number;
      neutral: number;
    };
  }>;
}

// Sentiment dictionary entry
interface SentimentWord {
  word: string;
  sentiment: 'positive' | 'negative';
  intensity: number; // 0-1
}

// Sentiment modifiers
interface SentimentModifier {
  word: string;
  modifierType: 'negation' | 'intensifier' | 'diminisher';
  factor: number;
}

/**
 * Sentiment Analyzer class for text sentiment analysis
 */
export class SentimentAnalyzer {
  private sentimentDictionary: Map<string, SentimentWord> = new Map();
  private modifiers: SentimentModifier[] = [];
  
  constructor() {
    this.initializeSentimentDictionary();
    this.initializeModifiers();
  }
  
  /**
   * Initialize sentiment dictionary with common words
   * In a real-world implementation, this would use a much larger lexicon
   */
  private initializeSentimentDictionary(): void {
    // Positive words
    const positiveWords: [string, number][] = [
      ['good', 0.6],
      ['great', 0.7],
      ['excellent', 0.8],
      ['outstanding', 0.9],
      ['amazing', 0.8],
      ['awesome', 0.8],
      ['wonderful', 0.7],
      ['fantastic', 0.8],
      ['pleased', 0.6],
      ['happy', 0.6],
      ['excited', 0.7],
      ['love', 0.8],
      ['best', 0.7],
      ['better', 0.6],
      ['superior', 0.7],
      ['perfect', 0.9],
      ['delighted', 0.8],
      ['successful', 0.7],
      ['impressive', 0.7],
      ['efficient', 0.6],
      ['effective', 0.6],
      ['favorable', 0.6],
      ['helpful', 0.6],
      ['positive', 0.6],
      ['responsive', 0.6],
      ['resolved', 0.6],
      ['satisfied', 0.7],
      ['recommend', 0.7],
      ['innovative', 0.6],
      ['elegant', 0.6]
    ];
    
    // Negative words
    const negativeWords: [string, number][] = [
      ['bad', 0.6],
      ['poor', 0.7],
      ['terrible', 0.8],
      ['awful', 0.8],
      ['horrible', 0.8],
      ['disappointing', 0.7],
      ['disappointed', 0.7],
      ['frustrating', 0.7],
      ['frustrated', 0.7],
      ['hate', 0.8],
      ['annoying', 0.7],
      ['slow', 0.6],
      ['difficult', 0.6],
      ['confusing', 0.6],
      ['error', 0.6],
      ['issue', 0.5],
      ['problem', 0.6],
      ['broken', 0.7],
      ['fail', 0.7],
      ['failed', 0.7],
      ['failure', 0.7],
      ['wrong', 0.7],
      ['bug', 0.6],
      ['defect', 0.7],
      ['glitch', 0.6],
      ['crash', 0.8]
    ];
    
    // Register positive words
    for (const [word, intensity] of positiveWords) {
      this.sentimentDictionary.set(word, {
        word,
        sentiment: 'positive',
        intensity
      });
    }
    
    // Register negative words
    for (const [word, intensity] of negativeWords) {
      this.sentimentDictionary.set(word, {
        word,
        sentiment: 'negative',
        intensity
      });
    }
  }
  
  /**
   * Initialize sentiment modifiers
   */
  private initializeModifiers(): void {
    // Negation words
    const negations = [
      'not',
      'never',
      'no',
      'neither',
      'nor',
      'none',
      "don't",
      "doesn't",
      "didn't",
      "won't",
      "wouldn't",
      "couldn't",
      "shouldn't",
      "hasn't",
      "haven't"
    ];
    
    // Intensifiers
    const intensifiers = [
      'very',
      'extremely',
      'incredibly',
      'really',
      'absolutely',
      'completely',
      'totally',
      'utterly',
      'highly',
      'especially'
    ];
    
    // Diminishers
    const diminishers = [
      'somewhat',
      'slightly',
      'a bit',
      'a little',
      'kind of',
      'sort of',
      'hardly',
      'barely'
    ];
    
    // Register negations
    for (const word of negations) {
      this.modifiers.push({
        word,
        modifierType: 'negation',
        factor: -1 // Flip sentiment
      });
    }
    
    // Register intensifiers
    for (const word of intensifiers) {
      this.modifiers.push({
        word,
        modifierType: 'intensifier',
        factor: 1.5 // Increase sentiment by 50%
      });
    }
    
    // Register diminishers
    for (const word of diminishers) {
      this.modifiers.push({
        word,
        modifierType: 'diminisher',
        factor: 0.5 // Reduce sentiment by 50%
      });
    }
  }
  
  /**
   * Tokenize text into words and sentences
   * @param text Text to tokenize
   * @returns Object containing words and sentences arrays
   */
  private tokenize(text: string): {
    words: string[];
    sentences: string[];
  } {
    const sentences = text
      .replace(/([.!?])\s*(?=[A-Z])/g, '$1|')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
    
    return { words, sentences };
  }
  
  /**
   * Calculate sentiment scores for a text
   * @param text Text to analyze
   * @returns Sentiment analysis results
   */
  public analyzeSentiment(text: string): SentimentResult {
    const { words, sentences } = this.tokenize(text);
    
    // Overall scores
    let positiveScore = 0;
    let negativeScore = 0;
    let wordCount = 0;
    
    // Process words with context
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const sentiment = this.sentimentDictionary.get(word);
      
      if (sentiment) {
        wordCount++;
        let score = sentiment.intensity;
        
        // Apply modifiers from preceding words
        if (i > 0) {
          for (let j = 1; j <= 3 && i - j >= 0; j++) {
            const prevWord = words[i - j];
            const modifier = this.modifiers.find(m => m.word === prevWord);
            
            if (modifier) {
              if (modifier.modifierType === 'negation') {
                // Flip sentiment
                score *= modifier.factor;
                break; // Only apply one negation
              } else if (modifier.modifierType === 'intensifier') {
                // Intensify sentiment
                score = Math.min(1.0, score * modifier.factor);
              } else if (modifier.modifierType === 'diminisher') {
                // Diminish sentiment
                score *= modifier.factor;
              }
            }
          }
        }
        
        // Add to appropriate score
        if (sentiment.sentiment === 'positive' && score > 0) {
          positiveScore += score;
        } else if (sentiment.sentiment === 'negative' || score < 0) {
          // Handle negated positives as negatives
          negativeScore += (Math.abs(score));
        }
      }
    }
    
    // Normalize scores
    const totalScore = positiveScore + negativeScore;
    let normalizedPositive = 0;
    let normalizedNegative = 0;
    
    if (totalScore > 0) {
      normalizedPositive = positiveScore / totalScore;
      normalizedNegative = negativeScore / totalScore;
    }
    
    const normalizedNeutral = Math.max(0, 1 - (normalizedPositive + normalizedNegative));
    
    // Determine overall sentiment
    let sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    
    if (normalizedPositive > 0.6 && normalizedNegative < 0.2) {
      sentiment = 'positive';
    } else if (normalizedNegative > 0.6 && normalizedPositive < 0.2) {
      sentiment = 'negative';
    } else if (normalizedPositive > 0.4 && normalizedNegative > 0.4) {
      sentiment = 'mixed';
    } else {
      sentiment = 'neutral';
    }
    
    // Calculate confidence
    const confidence = Math.max(normalizedPositive, normalizedNegative);
    
    // Process sentences
    const sentenceResults = sentences.map(sentence => {
      const sentenceAnalysis = this.analyzeSentiment(sentence);
      return {
        text: sentence,
        sentiment: sentenceAnalysis.sentiment,
        score: sentenceAnalysis.score
      };
    });
    
    return {
      text,
      sentiment,
      score: {
        positive: normalizedPositive,
        negative: normalizedNegative,
        neutral: normalizedNeutral
      },
      confidence,
      language: 'en', // Only English supported in this example
      sentences: sentenceResults
    };
  }
}

/**
 * Contextual sentiment analysis service for entity-level sentiment
 */
export class EntitySentimentAnalyzer {
  private sentimentAnalyzer: SentimentAnalyzer;
  private windowSize: number = 10; // Words before and after entity
  
  /**
   * Constructor with sentiment analyzer
   * @param analyzer Sentiment analyzer instance
   */
  constructor(analyzer?: SentimentAnalyzer) {
    this.sentimentAnalyzer = analyzer || new SentimentAnalyzer();
  }
  
  /**
   * Extract sentiment context around entities
   * @param text Full text
   * @param entityStart Start index of entity
   * @param entityEnd End index of entity
   * @returns Context window text
   */
  private extractEntityContext(
    text: string,
    entityStart: number,
    entityEnd: number
  ): string {
    // Extract words before entity
    const beforeText = text.substring(0, entityStart);
    const beforeWords = beforeText
      .split(/\s+/)
      .filter(w => w.length > 0)
      .slice(-this.windowSize);
    
    // Extract words after entity
    const afterText = text.substring(entityEnd);
    const afterWords = afterText
      .split(/\s+/)
      .filter(w => w.length > 0)
      .slice(0, this.windowSize);
    
    // Combine context
    const entityText = text.substring(entityStart, entityEnd);
    return [...beforeWords, entityText, ...afterWords].join(' ');
  }
  
  /**
   * Analyze sentiment for a specific entity in text
   * @param text Full text
   * @param entityStart Start index of entity
   * @param entityEnd End index of entity
   * @returns Sentiment result for entity context
   */
  public analyzeEntitySentiment(
    text: string,
    entityStart: number,
    entityEnd: number
  ): SentimentResult {
    const contextText = this.extractEntityContext(text, entityStart, entityEnd);
    return this.sentimentAnalyzer.analyzeSentiment(contextText);
  }
}

/**
 * Aspect-based sentiment analysis for identifying sentiment toward specific aspects
 */
export class AspectSentimentAnalyzer {
  private sentimentAnalyzer: SentimentAnalyzer;
  
  /**
   * Constructor with sentiment analyzer
   * @param analyzer Sentiment analyzer instance
   */
  constructor(analyzer?: SentimentAnalyzer) {
    this.sentimentAnalyzer = analyzer || new SentimentAnalyzer();
  }
  
  /**
   * Extract sentences containing specific aspect
   * @param text Full text
   * @param aspect Aspect to analyze
   * @returns Array of sentences containing the aspect
   */
  private extractAspectSentences(text: string, aspect: string): string[] {
    const { sentences } = this.sentimentAnalyzer['tokenize'](text);
    const normalizedAspect = aspect.toLowerCase();
    
    return sentences.filter(sentence => 
      sentence.toLowerCase().includes(normalizedAspect)
    );
  }
  
  /**
   * Analyze sentiment for a specific aspect in text
   * @param text Full text
   * @param aspect Aspect to analyze
   * @returns Sentiment result for aspect
   */
  public analyzeAspectSentiment(
    text: string,
    aspect: string
  ): SentimentResult | null {
    const aspectSentences = this.extractAspectSentences(text, aspect);
    
    if (aspectSentences.length === 0) {
      return null;
    }
    
    // Analyze each sentence containing the aspect
    const aspectText = aspectSentences.join(' ');
    return this.sentimentAnalyzer.analyzeSentiment(aspectText);
  }
  
  /**
   * Analyze sentiment for multiple aspects in text
   * @param text Full text
   * @param aspects Array of aspects to analyze
   * @returns Map of aspect to sentiment result
   */
  public analyzeMultipleAspects(
    text: string,
    aspects: string[]
  ): Map<string, SentimentResult | null> {
    const results = new Map<string, SentimentResult | null>();
    
    for (const aspect of aspects) {
      results.set(aspect, this.analyzeAspectSentiment(text, aspect));
    }
    
    return results;
  }
}

// Export singleton instances
let sentimentAnalyzer: SentimentAnalyzer | null = null;
let entitySentimentAnalyzer: EntitySentimentAnalyzer | null = null;
let aspectSentimentAnalyzer: AspectSentimentAnalyzer | null = null;

/**
 * Get the singleton sentiment analyzer instance
 * @returns Sentiment analyzer instance
 */
export function getSentimentAnalyzer(): SentimentAnalyzer {
  if (!sentimentAnalyzer) {
    sentimentAnalyzer = new SentimentAnalyzer();
  }
  
  return sentimentAnalyzer;
}

/**
 * Get the singleton entity sentiment analyzer instance
 * @returns Entity sentiment analyzer instance
 */
export function getEntitySentimentAnalyzer(): EntitySentimentAnalyzer {
  if (!entitySentimentAnalyzer) {
    entitySentimentAnalyzer = new EntitySentimentAnalyzer(getSentimentAnalyzer());
  }
  
  return entitySentimentAnalyzer;
}

/**
 * Get the singleton aspect sentiment analyzer instance
 * @returns Aspect sentiment analyzer instance
 */
export function getAspectSentimentAnalyzer(): AspectSentimentAnalyzer {
  if (!aspectSentimentAnalyzer) {
    aspectSentimentAnalyzer = new AspectSentimentAnalyzer(getSentimentAnalyzer());
  }
  
  return aspectSentimentAnalyzer;
}
