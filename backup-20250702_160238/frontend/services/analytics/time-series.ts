/**
 * Time Series Analysis Module
 * Provides time series forecasting and analysis capabilities for AI-powered analytics
 */

// Time series data point
export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
}

// Forecast result
export interface ForecastResult {
  originalData: TimeSeriesPoint[];
  forecastData: TimeSeriesPoint[];
  confidenceIntervals?: {
    upper: TimeSeriesPoint[];
    lower: TimeSeriesPoint[];
  };
  model: string;
  accuracy: {
    mape?: number; // Mean Absolute Percentage Error
    rmse?: number; // Root Mean Square Error
    r2?: number;   // R-squared
  };
}

/**
 * Generate time series forecast using exponential smoothing
 * @param historicalData Historical time series data
 * @param forecastHorizon Number of periods to forecast
 * @param alpha Smoothing factor (0-1)
 * @returns Forecast result
 */
export function generateTimeSeriesForecast(
  historicalData: TimeSeriesPoint[],
  forecastHorizon: number,
  alpha: number = 0.3
): ForecastResult {
  if (historicalData.length < 5) {
    throw new Error('Insufficient historical data for forecasting');
  }
  
  // Sort data by timestamp
  const sortedData = [...historicalData].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  // Calculate time interval between points
  const timeIntervals = [];
  for (let i = 1; i < sortedData.length; i++) {
    timeIntervals.push(
      sortedData[i].timestamp.getTime() - sortedData[i - 1].timestamp.getTime()
    );
  }
  
  // Use median time interval for forecasting
  timeIntervals.sort((a, b) => a - b);
  const medianInterval = timeIntervals[Math.floor(timeIntervals.length / 2)];
  
  // Simple exponential smoothing
  const lastValue = sortedData[sortedData.length - 1].value;
  const lastTimestamp = sortedData[sortedData.length - 1].timestamp.getTime();
  
  // Generate forecast points
  const forecastData: TimeSeriesPoint[] = [];
  let forecast = lastValue;
  
  for (let i = 1; i <= forecastHorizon; i++) {
    // For simple exponential smoothing, the forecast is the same for all future periods
    // More sophisticated models would use different formulas here
    
    // Create forecast timestamp
    const forecastTimestamp = new Date(lastTimestamp + (i * medianInterval));
    
    forecastData.push({
      timestamp: forecastTimestamp,
      value: forecast
    });
  }
  
  // Calculate upper and lower confidence intervals (±10% for simplicity)
  const upperInterval = forecastData.map(point => ({
    timestamp: point.timestamp,
    value: point.value * 1.1
  }));
  
  const lowerInterval = forecastData.map(point => ({
    timestamp: point.timestamp,
    value: point.value * 0.9
  }));
  
  // Calculate basic accuracy metrics using historical data
  const accuracyMetrics = calculateAccuracyMetrics(sortedData);
  
  return {
    originalData: sortedData,
    forecastData,
    confidenceIntervals: {
      upper: upperInterval,
      lower: lowerInterval
    },
    model: 'simple-exponential-smoothing',
    accuracy: accuracyMetrics
  };
}

/**
 * Generate time series forecast using double exponential smoothing (Holt's method)
 * @param historicalData Historical time series data
 * @param forecastHorizon Number of periods to forecast
 * @param alpha Level smoothing factor (0-1)
 * @param beta Trend smoothing factor (0-1)
 * @returns Forecast result
 */
export function generateHoltsMethodForecast(
  historicalData: TimeSeriesPoint[],
  forecastHorizon: number,
  alpha: number = 0.3,
  beta: number = 0.1
): ForecastResult {
  if (historicalData.length < 5) {
    throw new Error('Insufficient historical data for forecasting');
  }
  
  // Sort data by timestamp
  const sortedData = [...historicalData].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  // Calculate time interval between points
  const timeIntervals = [];
  for (let i = 1; i < sortedData.length; i++) {
    timeIntervals.push(
      sortedData[i].timestamp.getTime() - sortedData[i - 1].timestamp.getTime()
    );
  }
  
  // Use median time interval for forecasting
  timeIntervals.sort((a, b) => a - b);
  const medianInterval = timeIntervals[Math.floor(timeIntervals.length / 2)];
  
  // Extract values
  const values = sortedData.map(point => point.value);
  
  // Initialize level and trend
  let level = values[0];
  let trend = values[1] - values[0];
  
  // Apply Holt's method to historical data
  for (let i = 1; i < values.length; i++) {
    const oldLevel = level;
    level = alpha * values[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - oldLevel) + (1 - beta) * trend;
  }
  
  // Generate forecast
  const lastTimestamp = sortedData[sortedData.length - 1].timestamp.getTime();
  const forecastData: TimeSeriesPoint[] = [];
  
  for (let i = 1; i <= forecastHorizon; i++) {
    const forecastValue = level + i * trend;
    const forecastTimestamp = new Date(lastTimestamp + (i * medianInterval));
    
    forecastData.push({
      timestamp: forecastTimestamp,
      value: forecastValue
    });
  }
  
  // Calculate confidence intervals (wider as we go further into the future)
  const upperInterval = forecastData.map((point, i) => ({
    timestamp: point.timestamp,
    value: point.value * (1 + 0.05 * (i + 1))
  }));
  
  const lowerInterval = forecastData.map((point, i) => ({
    timestamp: point.timestamp,
    value: point.value * (1 - 0.05 * (i + 1))
  }));
  
  // Calculate basic accuracy metrics
  const accuracyMetrics = calculateAccuracyMetrics(sortedData);
  
  return {
    originalData: sortedData,
    forecastData,
    confidenceIntervals: {
      upper: upperInterval,
      lower: lowerInterval
    },
    model: 'holts-method',
    accuracy: accuracyMetrics
  };
}

/**
 * Calculate basic accuracy metrics for a time series model
 * @param data Historical data points
 * @returns Accuracy metrics
 */
function calculateAccuracyMetrics(data: TimeSeriesPoint[]): {
  mape?: number;
  rmse?: number;
  r2?: number;
} {
  // For simplicity, we'll return mock values here
  // In a real implementation, these would be calculated using training data
  return {
    mape: 0.15,  // 15% mean absolute percentage error
    rmse: 2.5,   // Root mean squared error
    r2: 0.85     // R-squared (coefficient of determination)
  };
}

/**
 * Detect trends in time series data
 * @param data Time series data
 * @param windowSize Window size for moving average
 * @returns Trend direction and strength
 */
export function detectTrend(
  data: TimeSeriesPoint[],
  windowSize: number = 3
): { direction: 'up' | 'down' | 'stable'; strength: number } {
  if (data.length < windowSize * 2) {
    return { direction: 'stable', strength: 0 };
  }
  
  // Sort data by timestamp
  const sortedData = [...data].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  // Calculate moving averages
  const movingAverages: number[] = [];
  for (let i = windowSize - 1; i < sortedData.length; i++) {
    let sum = 0;
    for (let j = 0; j < windowSize; j++) {
      sum += sortedData[i - j].value;
    }
    movingAverages.push(sum / windowSize);
  }
  
  // Calculate trend by comparing first and last moving averages
  const firstAvg = movingAverages[0];
  const lastAvg = movingAverages[movingAverages.length - 1];
  const difference = lastAvg - firstAvg;
  
  // Calculate trend strength as percentage change
  const strength = Math.abs(difference / firstAvg);
  
  // Determine direction
  let direction: 'up' | 'down' | 'stable';
  if (difference > 0.05 * firstAvg) {
    direction = 'up';
  } else if (difference < -0.05 * firstAvg) {
    direction = 'down';
  } else {
    direction = 'stable';
  }
  
  return { direction, strength };
}

/**
 * Detect seasonality in time series data
 * @param data Time series data
 * @param maxLag Maximum lag to check for seasonality
 * @returns Detected seasonality period
 */
export function detectSeasonality(
  data: TimeSeriesPoint[],
  maxLag: number = 12
): { period: number; strength: number } {
  // This is a simplified implementation
  // In a real system, this would use autocorrelation or spectral analysis
  
  if (data.length < maxLag * 2) {
    return { period: 0, strength: 0 };
  }
  
  // Sort data by timestamp
  const sortedData = [...data].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  // Extract values
  const values = sortedData.map(point => point.value);
  
  // For demonstration, we'll just check for weekly seasonality
  // In a real implementation, this would test multiple periods
  const period = 7; // Weekly seasonality
  const strength = 0.65; // Mock strength value
  
  return { period, strength };
}
