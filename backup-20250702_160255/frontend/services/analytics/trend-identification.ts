/**
 * Trend Identification System
 * Provides pattern recognition and trend analysis capabilities for AI-powered analytics
 */

import { TimeSeriesPoint } from './time-series';

// Trend result interface
export interface TrendResult {
  id: string;
  name: string;
  description: string;
  score: number; // 0-1 confidence score
  direction: 'increasing' | 'decreasing' | 'stable';
  magnitude: 'strong' | 'moderate' | 'weak';
  timeRange: {
    start: Date;
    end: Date;
  };
  dataPoints: TimeSeriesPoint[];
  category: string;
  relatedEntities?: string[];
  recommendedActions?: string[];
}

// Pattern definition
export interface PatternDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  detectionFunction: (data: TimeSeriesPoint[]) => boolean;
  scoreFunction: (data: TimeSeriesPoint[]) => number;
  directionFunction: (data: TimeSeriesPoint[]) => 'increasing' | 'decreasing' | 'stable';
  magnitudeFunction: (data: TimeSeriesPoint[]) => 'strong' | 'moderate' | 'weak';
  generateRecommendations?: (result: TrendResult) => string[];
}

/**
 * Trend Analyzer class for detecting and analyzing trends in time series data
 */
export class TrendAnalyzer {
  private patterns: PatternDefinition[] = [];
  
  /**
   * Constructor with optional pattern definitions
   * @param patterns Optional initial pattern definitions
   */
  constructor(patterns?: PatternDefinition[]) {
    if (patterns) {
      this.patterns = [...patterns];
    } else {
      this.registerDefaultPatterns();
    }
  }
  
  /**
   * Register a new pattern definition
   * @param pattern Pattern definition to register
   */
  public registerPattern(pattern: PatternDefinition): void {
    this.patterns.push(pattern);
  }
  
  /**
   * Register default pattern definitions
   */
  private registerDefaultPatterns(): void {
    // Consistent Growth Pattern
    this.registerPattern({
      id: 'consistent-growth',
      name: 'Consistent Growth',
      description: 'A steady increase in values over time',
      category: 'performance',
      detectionFunction: (data: TimeSeriesPoint[]) => {
        if (data.length < 5) return false;
        
        const sortedData = [...data].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        let increasingCount = 0;
        for (let i = 1; i < sortedData.length; i++) {
          if (sortedData[i].value > sortedData[i - 1].value) {
            increasingCount++;
          }
        }
        
        // At least 75% of points should be increasing
        return increasingCount >= (sortedData.length - 1) * 0.75;
      },
      scoreFunction: (data: TimeSeriesPoint[]) => {
        const sortedData = [...data].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        let increasingCount = 0;
        for (let i = 1; i < sortedData.length; i++) {
          if (sortedData[i].value > sortedData[i - 1].value) {
            increasingCount++;
          }
        }
        
        return increasingCount / (sortedData.length - 1);
      },
      directionFunction: () => 'increasing',
      magnitudeFunction: (data: TimeSeriesPoint[]) => {
        const sortedData = [...data].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        const firstValue = sortedData[0].value;
        const lastValue = sortedData[sortedData.length - 1].value;
        
        if (firstValue === 0) return 'strong';
        
        const percentChange = (lastValue - firstValue) / firstValue;
        
        if (percentChange > 0.5) return 'strong';
        if (percentChange > 0.2) return 'moderate';
        return 'weak';
      },
      generateRecommendations: (result: TrendResult) => {
        if (result.magnitude === 'strong') {
          return [
            'Maintain current strategies that are driving this positive trend',
            'Consider allocating more resources to capitalize on this growth',
            'Document best practices that have led to this success'
          ];
        } else if (result.magnitude === 'moderate') {
          return [
            'Continue monitoring this positive trend',
            'Investigate what factors are driving this growth',
            'Look for opportunities to accelerate the trend'
          ];
        } else {
          return [
            'Monitor this trend to ensure it continues growing',
            'Identify potential improvements to strengthen the trend'
          ];
        }
      }
    });
    
    // Consistent Decline Pattern
    this.registerPattern({
      id: 'consistent-decline',
      name: 'Consistent Decline',
      description: 'A steady decrease in values over time',
      category: 'performance',
      detectionFunction: (data: TimeSeriesPoint[]) => {
        if (data.length < 5) return false;
        
        const sortedData = [...data].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        let decreasingCount = 0;
        for (let i = 1; i < sortedData.length; i++) {
          if (sortedData[i].value < sortedData[i - 1].value) {
            decreasingCount++;
          }
        }
        
        // At least 75% of points should be decreasing
        return decreasingCount >= (sortedData.length - 1) * 0.75;
      },
      scoreFunction: (data: TimeSeriesPoint[]) => {
        const sortedData = [...data].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        let decreasingCount = 0;
        for (let i = 1; i < sortedData.length; i++) {
          if (sortedData[i].value < sortedData[i - 1].value) {
            decreasingCount++;
          }
        }
        
        return decreasingCount / (sortedData.length - 1);
      },
      directionFunction: () => 'decreasing',
      magnitudeFunction: (data: TimeSeriesPoint[]) => {
        const sortedData = [...data].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        const firstValue = sortedData[0].value;
        const lastValue = sortedData[sortedData.length - 1].value;
        
        if (firstValue === 0) return 'weak';
        
        const percentChange = (firstValue - lastValue) / firstValue;
        
        if (percentChange > 0.5) return 'strong';
        if (percentChange > 0.2) return 'moderate';
        return 'weak';
      },
      generateRecommendations: (result: TrendResult) => {
        if (result.magnitude === 'strong') {
          return [
            'Immediate attention required to address this significant decline',
            'Perform root cause analysis to identify what's driving this trend',
            'Consider intervention strategies to reverse the decline'
          ];
        } else if (result.magnitude === 'moderate') {
          return [
            'Investigate the factors contributing to this decline',
            'Develop mitigation strategies to address the trend',
            'Monitor closely to ensure the trend doesn't worsen'
          ];
        } else {
          return [
            'Monitor this trend to determine if action is needed',
            'Watch for early indicators of acceleration in the decline'
          ];
        }
      }
    });
    
    // Cyclical Pattern
    this.registerPattern({
      id: 'cyclical-pattern',
      name: 'Cyclical Pattern',
      description: 'A repeating pattern of increases and decreases',
      category: 'pattern',
      detectionFunction: (data: TimeSeriesPoint[]) => {
        if (data.length < 10) return false;
        
        // Simplified cyclical detection
        // In a real implementation, this would use autocorrelation or spectral analysis
        
        const sortedData = [...data].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        // Count direction changes
        let directionChanges = 0;
        let increasing = sortedData[1].value > sortedData[0].value;
        
        for (let i = 2; i < sortedData.length; i++) {
          const currentIncreasing = sortedData[i].value > sortedData[i - 1].value;
          
          if (currentIncreasing !== increasing) {
            directionChanges++;
            increasing = currentIncreasing;
          }
        }
        
        // A cyclical pattern should have multiple direction changes
        return directionChanges >= 3;
      },
      scoreFunction: (data: TimeSeriesPoint[]) => {
        // Simplified scoring based on number of direction changes
        const sortedData = [...data].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        let directionChanges = 0;
        let increasing = sortedData[1].value > sortedData[0].value;
        
        for (let i = 2; i < sortedData.length; i++) {
          const currentIncreasing = sortedData[i].value > sortedData[i - 1].value;
          
          if (currentIncreasing !== increasing) {
            directionChanges++;
            increasing = currentIncreasing;
          }
        }
        
        // Normalize to 0-1 scale (more direction changes = stronger cyclical pattern)
        return Math.min(directionChanges / 8, 1);
      },
      directionFunction: (data: TimeSeriesPoint[]) => {
        const sortedData = [...data].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        const firstValue = sortedData[0].value;
        const lastValue = sortedData[sortedData.length - 1].value;
        
        if (lastValue > firstValue * 1.05) return 'increasing';
        if (lastValue < firstValue * 0.95) return 'decreasing';
        return 'stable';
      },
      magnitudeFunction: (data: TimeSeriesPoint[]) => {
        const sortedData = [...data].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        // Calculate peak-to-trough ratio
        let min = Number.MAX_VALUE;
        let max = Number.MIN_VALUE;
        
        for (const point of sortedData) {
          min = Math.min(min, point.value);
          max = Math.max(max, point.value);
        }
        
        if (min === 0) return 'strong';
        
        const ratio = max / min;
        
        if (ratio > 2) return 'strong';
        if (ratio > 1.5) return 'moderate';
        return 'weak';
      },
      generateRecommendations: (result: TrendResult) => {
        return [
          'Plan resources to account for cyclical patterns',
          'Identify the drivers behind these cycles',
          'Develop strategies to optimize during peak periods'
        ];
      }
    });
  }
  
  /**
   * Analyze time series data for trends
   * @param data Time series data to analyze
   * @param categoryFilter Optional category filter
   * @param minConfidence Minimum confidence score (0-1)
   * @returns Array of detected trends
   */
  public analyzeTrends(
    data: TimeSeriesPoint[],
    categoryFilter?: string,
    minConfidence: number = 0.6
  ): TrendResult[] {
    const results: TrendResult[] = [];
    
    // Apply category filter if provided
    let patternsToCheck = this.patterns;
    if (categoryFilter) {
      patternsToCheck = this.patterns.filter(
        pattern => pattern.category === categoryFilter
      );
    }
    
    // Check each pattern against the data
    for (const pattern of patternsToCheck) {
      if (pattern.detectionFunction(data)) {
        const score = pattern.scoreFunction(data);
        
        // Only include results above minimum confidence threshold
        if (score >= minConfidence) {
          const sortedData = [...data].sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          );
          
          const result: TrendResult = {
            id: `trend-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: pattern.name,
            description: pattern.description,
            score,
            direction: pattern.directionFunction(data),
            magnitude: pattern.magnitudeFunction(data),
            timeRange: {
              start: sortedData[0].timestamp,
              end: sortedData[sortedData.length - 1].timestamp
            },
            dataPoints: sortedData,
            category: pattern.category
          };
          
          // Add recommendations if available
          if (pattern.generateRecommendations) {
            result.recommendedActions = pattern.generateRecommendations(result);
          }
          
          results.push(result);
        }
      }
    }
    
    // Sort by confidence score (descending)
    return results.sort((a, b) => b.score - a.score);
  }
}

/**
 * Trend alerting service for notifying users of important trends
 */
export class TrendAlertService {
  private subscribers: Map<string, (trend: TrendResult) => Promise<void>> = new Map();
  
  /**
   * Subscribe to trend alerts
   * @param subscriberId Unique subscriber ID
   * @param handler Handler function for trend alerts
   */
  public subscribe(
    subscriberId: string,
    handler: (trend: TrendResult) => Promise<void>
  ): void {
    this.subscribers.set(subscriberId, handler);
  }
  
  /**
   * Unsubscribe from trend alerts
   * @param subscriberId Subscriber ID to unsubscribe
   */
  public unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
  }
  
  /**
   * Process new trends and send alerts to subscribers
   * @param trends Array of detected trends
   * @param minAlertScore Minimum score threshold for alerting
   */
  public async processAlerts(
    trends: TrendResult[],
    minAlertScore: number = 0.8
  ): Promise<void> {
    // Filter for high-confidence trends
    const alertableTrends = trends.filter(trend => trend.score >= minAlertScore);
    
    if (alertableTrends.length === 0) {
      return;
    }
    
    // Send alerts to all subscribers
    const promises: Promise<void>[] = [];
    
    for (const trend of alertableTrends) {
      for (const handler of this.subscribers.values()) {
        promises.push(handler(trend));
      }
    }
    
    await Promise.all(promises);
  }
}

// Export singleton instances
let trendAnalyzer: TrendAnalyzer | null = null;
let trendAlertService: TrendAlertService | null = null;

/**
 * Get the singleton trend analyzer instance
 * @returns Trend analyzer instance
 */
export function getTrendAnalyzer(): TrendAnalyzer {
  if (!trendAnalyzer) {
    trendAnalyzer = new TrendAnalyzer();
  }
  
  return trendAnalyzer;
}

/**
 * Get the singleton trend alert service instance
 * @returns Trend alert service instance
 */
export function getTrendAlertService(): TrendAlertService {
  if (!trendAlertService) {
    trendAlertService = new TrendAlertService();
  }
  
  return trendAlertService;
}
