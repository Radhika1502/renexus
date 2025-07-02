/**
 * Anomaly Detection System
 * Provides real-time and historical anomaly detection for metrics and data streams
 */

import { TimeSeriesPoint } from './time-series';

// Anomaly result interface
export interface AnomalyResult {
  id: string;
  timestamp: Date;
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  relatedEntity?: {
    id: string;
    type: string;
    name: string;
  };
  isPositive: boolean;
  confidence: number;
}

// Anomaly detection configuration
export interface AnomalyDetectionConfig {
  sensitivityLevel: number; // 1-5, higher = more sensitive
  minDataPoints: number;    // Minimum data points required for detection
  baselineWindowSize: number; // Number of data points to use as baseline
  deviationThresholds: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  // Whether to detect positive anomalies (unusually high values)
  detectPositiveAnomalies: boolean;
  // Whether to detect negative anomalies (unusually low values)
  detectNegativeAnomalies: boolean;
}

// Default anomaly detection configuration
const DEFAULT_CONFIG: AnomalyDetectionConfig = {
  sensitivityLevel: 3,
  minDataPoints: 10,
  baselineWindowSize: 30,
  deviationThresholds: {
    critical: 3.0, // 3 standard deviations
    high: 2.5,     // 2.5 standard deviations
    medium: 2.0,   // 2 standard deviations
    low: 1.5       // 1.5 standard deviations
  },
  detectPositiveAnomalies: true,
  detectNegativeAnomalies: true
};

/**
 * Anomaly Detector class for identifying unusual patterns in data
 */
export class AnomalyDetector {
  private config: AnomalyDetectionConfig;
  private metricBaselines: Map<string, {
    mean: number;
    stdDev: number;
    lastUpdated: Date;
  }> = new Map();
  
  /**
   * Constructor with optional configuration
   * @param config Optional anomaly detection configuration
   */
  constructor(config?: Partial<AnomalyDetectionConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    
    // Apply sensitivity level
    this.adjustThresholdsBySensitivity();
  }
  
  /**
   * Adjust thresholds based on sensitivity level
   */
  private adjustThresholdsBySensitivity(): void {
    const sensitivityFactor = (6 - this.config.sensitivityLevel) / 3;
    
    this.config.deviationThresholds = {
      critical: 3.0 * sensitivityFactor,
      high: 2.5 * sensitivityFactor,
      medium: 2.0 * sensitivityFactor,
      low: 1.5 * sensitivityFactor
    };
  }
  
  /**
   * Update configuration
   * @param config New configuration (partial)
   */
  public updateConfig(config: Partial<AnomalyDetectionConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
    
    this.adjustThresholdsBySensitivity();
  }
  
  /**
   * Calculate statistical baseline for a metric
   * @param metricName Metric name
   * @param data Historical data points
   */
  public calculateBaseline(metricName: string, data: TimeSeriesPoint[]): void {
    if (data.length < this.config.minDataPoints) {
      throw new Error(`Insufficient data points for baseline calculation (${data.length} < ${this.config.minDataPoints})`);
    }
    
    // Sort data by timestamp
    const sortedData = [...data].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    // Use recent data window for baseline
    const baselineData = sortedData.slice(-this.config.baselineWindowSize);
    const values = baselineData.map(point => point.value);
    
    // Calculate mean
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate standard deviation
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Store or update baseline
    this.metricBaselines.set(metricName, {
      mean,
      stdDev,
      lastUpdated: new Date()
    });
  }
  
  /**
   * Detect anomalies in new data points
   * @param metricName Metric name
   * @param dataPoints New data points to check
   * @param relatedEntity Optional related entity information
   * @returns Array of detected anomalies
   */
  public detectAnomalies(
    metricName: string,
    dataPoints: TimeSeriesPoint[],
    relatedEntity?: { id: string; type: string; name: string }
  ): AnomalyResult[] {
    const baseline = this.metricBaselines.get(metricName);
    
    if (!baseline) {
      throw new Error(`No baseline calculated for metric: ${metricName}`);
    }
    
    const results: AnomalyResult[] = [];
    
    for (const point of dataPoints) {
      // Calculate deviation from baseline
      const deviation = (point.value - baseline.mean) / baseline.stdDev;
      const absDeviation = Math.abs(deviation);
      
      // Skip if within normal range
      if (absDeviation < this.config.deviationThresholds.low) {
        continue;
      }
      
      // Skip positive anomalies if not detecting them
      if (deviation > 0 && !this.config.detectPositiveAnomalies) {
        continue;
      }
      
      // Skip negative anomalies if not detecting them
      if (deviation < 0 && !this.config.detectNegativeAnomalies) {
        continue;
      }
      
      // Determine severity
      let severity: 'critical' | 'high' | 'medium' | 'low';
      if (absDeviation >= this.config.deviationThresholds.critical) {
        severity = 'critical';
      } else if (absDeviation >= this.config.deviationThresholds.high) {
        severity = 'high';
      } else if (absDeviation >= this.config.deviationThresholds.medium) {
        severity = 'medium';
      } else {
        severity = 'low';
      }
      
      // Calculate confidence based on deviation
      const maxDeviation = this.config.deviationThresholds.critical * 1.5;
      const confidence = Math.min(absDeviation / maxDeviation, 1.0);
      
      // Generate description
      const direction = deviation > 0 ? 'higher' : 'lower';
      const percentage = Math.abs(((point.value - baseline.mean) / baseline.mean) * 100).toFixed(1);
      const description = `${metricName} is ${percentage}% ${direction} than normal (${absDeviation.toFixed(2)} standard deviations)`;
      
      // Create anomaly result
      const anomaly: AnomalyResult = {
        id: `anomaly-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        timestamp: point.timestamp,
        metric: metricName,
        value: point.value,
        expectedValue: baseline.mean,
        deviation,
        severity,
        description,
        relatedEntity,
        isPositive: deviation > 0,
        confidence
      };
      
      results.push(anomaly);
    }
    
    return results;
  }
  
  /**
   * Check if a single data point is anomalous
   * @param metricName Metric name
   * @param value Value to check
   * @param timestamp Timestamp of the value
   * @param relatedEntity Optional related entity information
   * @returns Anomaly result if anomalous, null otherwise
   */
  public checkSingleValue(
    metricName: string,
    value: number,
    timestamp: Date = new Date(),
    relatedEntity?: { id: string; type: string; name: string }
  ): AnomalyResult | null {
    const baseline = this.metricBaselines.get(metricName);
    
    if (!baseline) {
      throw new Error(`No baseline calculated for metric: ${metricName}`);
    }
    
    // Calculate deviation from baseline
    const deviation = (value - baseline.mean) / baseline.stdDev;
    const absDeviation = Math.abs(deviation);
    
    // Check if within normal range
    if (absDeviation < this.config.deviationThresholds.low) {
      return null;
    }
    
    // Check if we should detect this type of anomaly
    if (deviation > 0 && !this.config.detectPositiveAnomalies) {
      return null;
    }
    
    if (deviation < 0 && !this.config.detectNegativeAnomalies) {
      return null;
    }
    
    // Determine severity
    let severity: 'critical' | 'high' | 'medium' | 'low';
    if (absDeviation >= this.config.deviationThresholds.critical) {
      severity = 'critical';
    } else if (absDeviation >= this.config.deviationThresholds.high) {
      severity = 'high';
    } else if (absDeviation >= this.config.deviationThresholds.medium) {
      severity = 'medium';
    } else {
      severity = 'low';
    }
    
    // Calculate confidence based on deviation
    const maxDeviation = this.config.deviationThresholds.critical * 1.5;
    const confidence = Math.min(absDeviation / maxDeviation, 1.0);
    
    // Generate description
    const direction = deviation > 0 ? 'higher' : 'lower';
    const percentage = Math.abs(((value - baseline.mean) / baseline.mean) * 100).toFixed(1);
    const description = `${metricName} is ${percentage}% ${direction} than normal (${absDeviation.toFixed(2)} standard deviations)`;
    
    // Create anomaly result
    return {
      id: `anomaly-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp,
      metric: metricName,
      value,
      expectedValue: baseline.mean,
      deviation,
      severity,
      description,
      relatedEntity,
      isPositive: deviation > 0,
      confidence
    };
  }
}

/**
 * Real-time anomaly monitoring system
 */
export class AnomalyMonitor {
  private detector: AnomalyDetector;
  private subscribers: Map<string, (anomaly: AnomalyResult) => Promise<void>> = new Map();
  private metrics: Set<string> = new Set();
  private dataBuffer: Map<string, TimeSeriesPoint[]> = new Map();
  private bufferSize: number = 100;
  
  /**
   * Constructor with anomaly detector
   * @param detector Anomaly detector instance
   */
  constructor(detector: AnomalyDetector) {
    this.detector = detector;
  }
  
  /**
   * Register a metric for monitoring
   * @param metricName Metric name
   * @param initialData Initial data for baseline calculation
   */
  public registerMetric(metricName: string, initialData: TimeSeriesPoint[]): void {
    this.metrics.add(metricName);
    this.dataBuffer.set(metricName, []);
    
    // Calculate initial baseline
    this.detector.calculateBaseline(metricName, initialData);
  }
  
  /**
   * Unregister a metric from monitoring
   * @param metricName Metric name to unregister
   */
  public unregisterMetric(metricName: string): void {
    this.metrics.delete(metricName);
    this.dataBuffer.delete(metricName);
  }
  
  /**
   * Subscribe to anomaly alerts
   * @param subscriberId Unique subscriber ID
   * @param handler Handler function for anomaly alerts
   */
  public subscribe(
    subscriberId: string,
    handler: (anomaly: AnomalyResult) => Promise<void>
  ): void {
    this.subscribers.set(subscriberId, handler);
  }
  
  /**
   * Unsubscribe from anomaly alerts
   * @param subscriberId Subscriber ID to unsubscribe
   */
  public unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
  }
  
  /**
   * Process a new data point for a monitored metric
   * @param metricName Metric name
   * @param value New value
   * @param timestamp Optional timestamp (defaults to now)
   * @param relatedEntity Optional related entity information
   */
  public async processDataPoint(
    metricName: string,
    value: number,
    timestamp: Date = new Date(),
    relatedEntity?: { id: string; type: string; name: string }
  ): Promise<void> {
    if (!this.metrics.has(metricName)) {
      throw new Error(`Metric not registered for monitoring: ${metricName}`);
    }
    
    const dataPoint: TimeSeriesPoint = { timestamp, value };
    
    // Add to buffer
    const buffer = this.dataBuffer.get(metricName) || [];
    buffer.push(dataPoint);
    
    // Trim buffer if needed
    if (buffer.length > this.bufferSize) {
      buffer.shift();
    }
    
    this.dataBuffer.set(metricName, buffer);
    
    // Check for anomaly
    const anomaly = this.detector.checkSingleValue(metricName, value, timestamp, relatedEntity);
    
    if (anomaly) {
      // Notify subscribers
      const promises: Promise<void>[] = [];
      
      for (const handler of this.subscribers.values()) {
        promises.push(handler(anomaly).catch(error => {
          console.error('Error in anomaly handler:', error);
        }));
      }
      
      await Promise.all(promises);
      
      // Recalculate baseline occasionally for drift adaptation
      // In a real system, this would be more sophisticated
      if (Math.random() < 0.1) { // 10% chance on each anomaly
        this.recalculateBaseline(metricName);
      }
    }
  }
  
  /**
   * Recalculate baseline for a metric
   * @param metricName Metric name
   */
  private recalculateBaseline(metricName: string): void {
    const buffer = this.dataBuffer.get(metricName);
    
    if (buffer && buffer.length >= this.detector['config'].minDataPoints) {
      // Use only normal data points (non-anomalous) for recalculation
      const normalPoints = buffer.filter(point => {
        const anomaly = this.detector.checkSingleValue(metricName, point.value, point.timestamp);
        return !anomaly; // Only use points that aren't anomalous
      });
      
      if (normalPoints.length >= this.detector['config'].minDataPoints) {
        this.detector.calculateBaseline(metricName, normalPoints);
      }
    }
  }
}

// Export singleton instances
let anomalyDetector: AnomalyDetector | null = null;
let anomalyMonitor: AnomalyMonitor | null = null;

/**
 * Get the singleton anomaly detector instance
 * @returns Anomaly detector instance
 */
export function getAnomalyDetector(): AnomalyDetector {
  if (!anomalyDetector) {
    anomalyDetector = new AnomalyDetector();
  }
  
  return anomalyDetector;
}

/**
 * Get the singleton anomaly monitor instance
 * @returns Anomaly monitor instance
 */
export function getAnomalyMonitor(): AnomalyMonitor {
  if (!anomalyMonitor) {
    anomalyMonitor = new AnomalyMonitor(getAnomalyDetector());
  }
  
  return anomalyMonitor;
}
