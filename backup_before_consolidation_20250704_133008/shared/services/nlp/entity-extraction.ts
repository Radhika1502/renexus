/**
 * Entity Extraction System
 * Provides named entity recognition and extraction for natural language text
 */

// Entity types supported by the system
export type EntityType = 
  'person' | 
  'date' | 
  'time' | 
  'duration' | 
  'location' | 
  'organization' | 
  'project' | 
  'task' | 
  'priority' | 
  'percentage' | 
  'currency' | 
  'email' | 
  'phone' | 
  'url';

// Entity definition
export interface Entity {
  type: EntityType;
  value: string;
  normalizedValue?: any;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

// Entity extraction result
export interface EntityExtractionResult {
  entities: Entity[];
  text: string;
  language: string;
}

// Pattern for entity matching
interface EntityPattern {
  type: EntityType;
  regex: RegExp;
  normalizer?: (value: string) => any;
  validator?: (value: string) => boolean;
}

/**
 * Entity Extractor class for named entity recognition
 */
export class EntityExtractor {
  private patterns: EntityPattern[] = [];
  
  constructor() {
    this.registerDefaultPatterns();
  }
  
  /**
   * Register a custom entity pattern
   * @param type Entity type
   * @param regex Regular expression pattern
   * @param normalizer Optional normalizer function
   * @param validator Optional validator function
   */
  public registerPattern(
    type: EntityType,
    regex: RegExp,
    normalizer?: (value: string) => any,
    validator?: (value: string) => boolean
  ): void {
    this.patterns.push({
      type,
      regex,
      normalizer,
      validator
    });
  }
  
  /**
   * Register default entity patterns
   */
  private registerDefaultPatterns(): void {
    // Person names (simple pattern - in real system would use NER models)
    this.registerPattern(
      'person',
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g
    );
    
    // Dates in various formats
    this.registerPattern(
      'date',
      /\b((?:\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})\b/gi,
      (value: string) => {
        try {
          return new Date(value);
        } catch (e) {
          return value;
        }
      }
    );
    
    // Time expressions
    this.registerPattern(
      'time',
      /\b(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\b/gi
    );
    
    // Duration expressions
    this.registerPattern(
      'duration',
      /\b(\d+\s*(?:hour|hr|minute|min|day|week|month|year)s?)\b/gi
    );
    
    // Locations (simple pattern)
    this.registerPattern(
      'location',
      /\b([A-Z][a-z]+(?:,\s+[A-Z][a-z]+)*)\b/g
    );
    
    // Organizations (simple pattern - in real system would use NER models)
    this.registerPattern(
      'organization',
      /\b([A-Z][a-z]*(?:\s+[A-Z][a-z]*)*(?:\s+(?:Inc|LLC|Corp|Corporation|Company|Co|Ltd))?)\b/g
    );
    
    // Project references
    this.registerPattern(
      'project',
      /\b(Project\s+[A-Za-z0-9]+|[A-Z][a-z]+\s+project)\b/gi
    );
    
    // Task references
    this.registerPattern(
      'task',
      /\b(Task\s+[A-Za-z0-9\-]+|T\-[0-9]+)\b/gi
    );
    
    // Priority levels
    this.registerPattern(
      'priority',
      /\b(critical|high|medium|low|highest|lowest|urgent|normal)\s+priority\b/gi,
      (value: string) => {
        const normalized = value.toLowerCase().replace(/\s+priority$/, '');
        
        // Map to standard priority values
        if (['critical', 'highest', 'urgent'].includes(normalized)) {
          return 'critical';
        } else if (normalized === 'high') {
          return 'high';
        } else if (['medium', 'normal'].includes(normalized)) {
          return 'medium';
        } else {
          return 'low';
        }
      }
    );
    
    // Percentages
    this.registerPattern(
      'percentage',
      /\b(\d+(?:\.\d+)?%|\d+(?:\.\d+)?\s+percent)\b/gi,
      (value: string) => {
        const num = parseFloat(value.replace(/[%\s+percent]/gi, ''));
        return num / 100;
      }
    );
    
    // Currency amounts
    this.registerPattern(
      'currency',
      /\b(\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s+(?:dollars|USD|EUR|GBP))\b/gi,
      (value: string) => {
        return parseFloat(value.replace(/[^\d\.]/g, ''));
      }
    );
    
    // Email addresses
    this.registerPattern(
      'email',
      /\b([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})\b/gi
    );
    
    // Phone numbers
    this.registerPattern(
      'phone',
      /\b((?:\+\d{1,2}\s*)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4})\b/g
    );
    
    // URLs
    this.registerPattern(
      'url',
      /\b(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*))\b/gi
    );
  }
  
  /**
   * Extract entities from text
   * @param text Text to analyze
   * @returns Entity extraction result
   */
  public extractEntities(text: string): EntityExtractionResult {
    const entities: Entity[] = [];
    
    // Apply each pattern
    for (const pattern of this.patterns) {
      const matches = Array.from(text.matchAll(pattern.regex));
      
      for (const match of matches) {
        const value = match[1] || match[0];
        const startIndex = match.index || 0;
        const endIndex = startIndex + value.length;
        
        // Skip if validator fails
        if (pattern.validator && !pattern.validator(value)) {
          continue;
        }
        
        // Normalize value if normalizer provided
        const normalizedValue = pattern.normalizer ? pattern.normalizer(value) : undefined;
        
        // Simple confidence scoring - in real system this would be more sophisticated
        const confidence = 0.85;
        
        entities.push({
          type: pattern.type,
          value,
          normalizedValue,
          startIndex,
          endIndex,
          confidence
        });
      }
    }
    
    // Sort by start index
    entities.sort((a, b) => a.startIndex - b.startIndex);
    
    // Remove overlapping entities (keep highest confidence)
    const filteredEntities = this.resolveOverlappingEntities(entities);
    
    return {
      entities: filteredEntities,
      text,
      language: 'en' // Only English supported in this example
    };
  }
  
  /**
   * Resolve overlapping entities
   * @param entities Array of entities
   * @returns Filtered array without overlaps
   */
  private resolveOverlappingEntities(entities: Entity[]): Entity[] {
    const result: Entity[] = [];
    
    for (let i = 0; i < entities.length; i++) {
      const current = entities[i];
      let overlapping = false;
      
      // Check for overlaps with already-added entities
      for (let j = 0; j < result.length; j++) {
        const existing = result[j];
        
        if (
          (current.startIndex >= existing.startIndex && current.startIndex <= existing.endIndex) ||
          (current.endIndex >= existing.startIndex && current.endIndex <= existing.endIndex) ||
          (current.startIndex <= existing.startIndex && current.endIndex >= existing.endIndex)
        ) {
          // Overlaps - keep the one with higher confidence
          overlapping = true;
          
          if (current.confidence > existing.confidence) {
            // Replace existing with current
            result[j] = current;
          }
          
          break;
        }
      }
      
      // Add if no overlaps
      if (!overlapping) {
        result.push(current);
      }
    }
    
    return result;
  }
}

/**
 * Entity Linking System to connect extracted entities to knowledge base
 */
export class EntityLinkingSystem {
  private knowledgeBase: Map<EntityType, Map<string, any>> = new Map();
  
  /**
   * Register an entity in the knowledge base
   * @param type Entity type
   * @param id Entity ID
   * @param data Entity data
   */
  public registerEntity(
    type: EntityType,
    id: string,
    data: any
  ): void {
    if (!this.knowledgeBase.has(type)) {
      this.knowledgeBase.set(type, new Map());
    }
    
    const typeMap = this.knowledgeBase.get(type);
    typeMap?.set(id.toLowerCase(), { id, ...data });
  }
  
  /**
   * Batch register entities
   * @param type Entity type
   * @param entities Entity data objects with IDs
   */
  public registerEntities(
    type: EntityType,
    entities: { id: string; [key: string]: any }[]
  ): void {
    for (const entity of entities) {
      this.registerEntity(type, entity.id, entity);
    }
  }
  
  /**
   * Link extracted entities to knowledge base entries
   * @param entities Extracted entities
   * @returns Entity linking result with additional data
   */
  public linkEntities(entities: Entity[]): {
    entity: Entity;
    linkedData?: any;
    linkedId?: string;
  }[] {
    return entities.map(entity => {
      const typeMap = this.knowledgeBase.get(entity.type);
      
      if (!typeMap) {
        return { entity };
      }
      
      // Try exact match
      const normalizedValue = entity.value.toLowerCase();
      const exactMatch = typeMap.get(normalizedValue);
      
      if (exactMatch) {
        return {
          entity,
          linkedData: exactMatch,
          linkedId: exactMatch.id
        };
      }
      
      // Try fuzzy match (simple implementation)
      let bestMatch: { id: string; data: any; score: number } | null = null;
      
      for (const [id, data] of typeMap.entries()) {
        const score = this.calculateSimilarity(normalizedValue, id.toLowerCase());
        
        if (score > 0.8 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { id, data, score };
        }
      }
      
      if (bestMatch) {
        return {
          entity,
          linkedData: bestMatch.data,
          linkedId: bestMatch.data.id
        };
      }
      
      return { entity };
    });
  }
  
  /**
   * Calculate string similarity score (simple implementation)
   * @param a First string
   * @param b Second string
   * @returns Similarity score (0-1)
   */
  private calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;
    
    // Very simple similarity metric - in real system, use more sophisticated approach
    // Like Levenshtein distance, Jaccard similarity, etc.
    const shorterLength = Math.min(a.length, b.length);
    let matchingChars = 0;
    
    for (let i = 0; i < shorterLength; i++) {
      if (a[i] === b[i]) {
        matchingChars++;
      }
    }
    
    return matchingChars / Math.max(a.length, b.length);
  }
}

// Export singleton instances
let entityExtractor: EntityExtractor | null = null;
let entityLinkingSystem: EntityLinkingSystem | null = null;

/**
 * Get the singleton entity extractor instance
 * @returns Entity extractor instance
 */
export function getEntityExtractor(): EntityExtractor {
  if (!entityExtractor) {
    entityExtractor = new EntityExtractor();
  }
  
  return entityExtractor;
}

/**
 * Get the singleton entity linking system instance
 * @returns Entity linking system instance
 */
export function getEntityLinkingSystem(): EntityLinkingSystem {
  if (!entityLinkingSystem) {
    entityLinkingSystem = new EntityLinkingSystem();
  }
  
  return entityLinkingSystem;
}
