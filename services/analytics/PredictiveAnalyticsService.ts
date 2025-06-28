import { 
  PredictiveMetric, 
  TimeSeriesDataPoint, 
  ForecastResult,
  AnomalyDetection
} from '../../types/analytics';
import { Task } from '../../types/task';
import AnalyticsCore from './AnalyticsCore';

/**
 * Predictive Analytics Service
 * 
 * Provides advanced analytics capabilities including forecasting, 
 * trend analysis, and anomaly detection
 */
class PredictiveAnalyticsService {
  private static instance: PredictiveAnalyticsService;
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): PredictiveAnalyticsService {
    if (!PredictiveAnalyticsService.instance) {
      PredictiveAnalyticsService.instance = new PredictiveAnalyticsService();
    }
    return PredictiveAnalyticsService.instance;
  }
  
  /**
   * Forecast task completion trend
   * Uses simple linear regression for prediction
   */
  public forecastTaskCompletion(
    historicalData: TimeSeriesDataPoint[], 
    daysToForecast: number
  ): ForecastResult {
    // Ensure we have enough data points
    if (historicalData.length < 5) {
      return {
        metric: 'taskCompletion',
        currentValue: historicalData.length > 0 ? historicalData[historicalData.length - 1].value : 0,
        forecastValues: [],
        confidence: 0
      };
    }
    
    // Extract x (days) and y (completions) values
    const xValues: number[] = [];
    const yValues: number[] = [];
    
    historicalData.forEach((dataPoint, index) => {
      xValues.push(index);
      yValues.push(dataPoint.value);
    });
    
    // Calculate linear regression coefficients
    const { slope, intercept, rSquared } = this.calculateLinearRegression(xValues, yValues);
    
    // Generate forecast values
    const forecastValues = [];
    const lastDate = new Date(historicalData[historicalData.length - 1].date);
    
    for (let i = 1; i <= daysToForecast; i++) {
      const x = xValues.length + i;
      const predictedValue = slope * x + intercept;
      
      // Calculate prediction intervals (simple approach)
      const standardError = Math.sqrt(1 - rSquared) * this.calculateStandardDeviation(yValues);
      const marginOfError = 1.96 * standardError; // 95% confidence interval
      
      // Generate forecast date
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + i);
      
      forecastValues.push({
        date: forecastDate.toISOString().split('T')[0],
        value: Math.max(0, Math.round(predictedValue)),
        lowerBound: Math.max(0, Math.round(predictedValue - marginOfError)),
        upperBound: Math.max(0, Math.round(predictedValue + marginOfError))
      });
    }
    
    return {
      metric: 'taskCompletion',
      currentValue: historicalData[historicalData.length - 1].value,
      forecastValues,
      confidence: rSquared
    };
  }
  
  /**
   * Calculate linear regression coefficients
   */
  private calculateLinearRegression(x: number[], y: number[]): { slope: number; intercept: number; rSquared: number } {
    const n = x.length;
    
    // Calculate means
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean);
      denominator += (x[i] - xMean) ** 2;
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;
    
    // Calculate R-squared
    let totalSumOfSquares = 0;
    let residualSumOfSquares = 0;
    
    for (let i = 0; i < n; i++) {
      const predicted = slope * x[i] + intercept;
      totalSumOfSquares += (y[i] - yMean) ** 2;
      residualSumOfSquares += (y[i] - predicted) ** 2;
    }
    
    const rSquared = totalSumOfSquares !== 0 ? 1 - (residualSumOfSquares / totalSumOfSquares) : 0;
    
    return { slope, intercept, rSquared };
  }
  
  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    const n = values.length;
    
    if (n <= 1) {
      return 0;
    }
    
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const squaredDifferences = values.map(val => (val - mean) ** 2);
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / (n - 1);
    
    return Math.sqrt(variance);
  }
  
  /**
   * Detect anomalies in time series data
   * Uses Z-score method for anomaly detection
   */
  public detectAnomalies(
    timeSeriesData: TimeSeriesDataPoint[],
    sensitivityThreshold: number = 2.0
  ): AnomalyDetection[] {
    if (timeSeriesData.length < 7) {
      return []; // Not enough data for reliable anomaly detection
    }
    
    const values = timeSeriesData.map(point => point.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = this.calculateStandardDeviation(values);
    
    if (stdDev === 0) {
      return []; // No variation in the data
    }
    
    const anomalies: AnomalyDetection[] = [];
    
    timeSeriesData.forEach((dataPoint, index) => {
      const zScore = Math.abs((dataPoint.value - mean) / stdDev);
      
      if (zScore > sensitivityThreshold) {
        let severity: 'low' | 'medium' | 'high';
        
        if (zScore > 3.0) {
          severity = 'high';
        } else if (zScore > 2.5) {
          severity = 'medium';
        } else {
          severity = 'low';
        }
        
        anomalies.push({
          id: `anomaly-${dataPoint.date}`,
          metric: 'taskCompletion',
          timestamp: dataPoint.date,
          expectedValue: mean,
          actualValue: dataPoint.value,
          deviation: zScore,
          severity,
          description: `Unusual ${dataPoint.value > mean ? 'spike' : 'drop'} in task completions`
        });
      }
    });
    
    return anomalies;
  }
  
  /**
   * Predict task completion time based on historical data
   */
  public predictTaskCompletionTime(
    task: Task,
    similarTasks: Task[]
  ): { estimatedHours: number; confidence: number } {
    // Filter for completed tasks with actual hours
    const completedTasks = similarTasks.filter(t => 
      t.status === 'done' && 
      t.actualHours !== undefined && 
      t.actualHours > 0
    );
    
    if (completedTasks.length < 3) {
      // Not enough data for reliable prediction
      return {
        estimatedHours: task.estimatedHours || 0,
        confidence: 0
      };
    }
    
    // Calculate weighted average based on task similarity
    let totalWeight = 0;
    let weightedSum = 0;
    
    completedTasks.forEach(completedTask => {
      // Calculate similarity score (simple implementation)
      const similarityScore = this.calculateTaskSimilarity(task, completedTask);
      
      // Apply weight based on similarity
      const weight = similarityScore;
      weightedSum += (completedTask.actualHours || 0) * weight;
      totalWeight += weight;
    });
    
    const estimatedHours = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    // Calculate confidence based on sample size and variance
    const actualHours = completedTasks.map(t => t.actualHours || 0);
    const variance = this.calculateVariance(actualHours);
    const sampleSizeFactor = Math.min(1, completedTasks.length / 10);
    const varianceFactor = Math.max(0, 1 - Math.min(1, variance / 100));
    
    const confidence = sampleSizeFactor * varianceFactor;
    
    return {
      estimatedHours: Math.round(estimatedHours * 10) / 10, // Round to 1 decimal place
      confidence
    };
  }
  
  /**
   * Calculate similarity between two tasks (simple implementation)
   */
  private calculateTaskSimilarity(task1: Task, task2: Task): number {
    let score = 0;
    
    // Same priority
    if (task1.priority === task2.priority) {
      score += 0.2;
    }
    
    // Same assignee
    if (task1.assigneeId && task2.assigneeId && task1.assigneeId === task2.assigneeId) {
      score += 0.3;
    }
    
    // Similar estimated hours
    if (task1.estimatedHours && task2.estimatedHours) {
      const hoursDiff = Math.abs(task1.estimatedHours - task2.estimatedHours);
      if (hoursDiff < 1) {
        score += 0.3;
      } else if (hoursDiff < 4) {
        score += 0.2;
      } else if (hoursDiff < 8) {
        score += 0.1;
      }
    }
    
    // Similar tags
    if (task1.tags && task2.tags && task1.tags.length > 0 && task2.tags.length > 0) {
      const commonTags = task1.tags.filter(tag => task2.tags?.includes(tag));
      if (commonTags.length > 0) {
        score += 0.2 * (commonTags.length / Math.max(task1.tags.length, task2.tags.length));
      }
    }
    
    return score;
  }
  
  /**
   * Calculate variance of a set of values
   */
  private calculateVariance(values: number[]): number {
    const n = values.length;
    
    if (n <= 1) {
      return 0;
    }
    
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const squaredDifferences = values.map(val => (val - mean) ** 2);
    
    return squaredDifferences.reduce((sum, val) => sum + val, 0) / (n - 1);
  }
}

export default PredictiveAnalyticsService;
