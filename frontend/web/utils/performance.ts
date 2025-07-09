import { useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';

// Performance monitoring
export const measurePerformance = (metricName: string) => {
  const startTime = performance.now();
  return {
    end: () => {
      const duration = performance.now() - startTime;
      // Report to monitoring service
      reportPerformanceMetric(metricName, duration);
      return duration;
    },
  };
};

// Report metrics to monitoring service
const reportPerformanceMetric = (name: string, value: number) => {
  // This would send metrics to your monitoring service (e.g., Google Analytics)
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Google Analytics
    window.gtag?.('event', 'performance_metric', {
      metric_name: name,
      value,
    });
  }
};

// Custom hook for tracking component render time
export const useRenderTracking = (componentName: string) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    const measurement = measurePerformance(`${componentName}_render`);
    
    return () => {
      measurement.end();
    };
  });

  return renderCount.current;
};

// Custom hook for lazy loading images
export const useLazyImage = (src: string) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          imgRef.current!.src = src;
          setLoaded(true);
          observer.disconnect();
        }
      });
    });

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [src]);

  return { imgRef, loaded };
};

// Debounced API request hook
export const useDebouncedRequest = <T>(
  request: (...args: any[]) => Promise<T>,
  delay: number = 300
) => {
  const debouncedFn = useCallback(
    debounce((...args: any[]) => request(...args), delay),
    [request, delay]
  );

  return debouncedFn;
};

// Virtual list renderer for large lists
export const VirtualList = ({
  items,
  height,
  itemHeight,
  renderItem,
}: {
  items: any[];
  height: number;
  itemHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleItemCount = Math.ceil(height / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItemCount + 1, items.length);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      style={{ height, overflow: 'auto' }}
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) =>
            renderItem(item, startIndex + index)
          )}
        </div>
      </div>
    </div>
  );
};

// Cache management for React Query
export const queryCache = {
  prefetch: async (queryKey: string, queryFn: () => Promise<any>) => {
    try {
      const data = await queryFn();
      queryClient.setQueryData(queryKey, data);
    } catch (error) {
      console.error('Failed to prefetch query', { queryKey, error });
    }
  },

  invalidate: (queryKey: string) => {
    queryClient.invalidateQueries(queryKey);
  },

  removeStale: () => {
    queryClient.removeQueries({ stale: true });
  },
};

// Web Worker for heavy computations
export const createWorker = (workerFunction: () => void) => {
  const blob = new Blob(
    [`(${workerFunction.toString()})()`],
    { type: 'application/javascript' }
  );
  return new Worker(URL.createObjectURL(blob));
};

// Service Worker registration
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Performance monitoring for React components
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetrics() {
    const result: Record<string, { avg: number; min: number; max: number }> = {};
    
    this.metrics.forEach((values, name) => {
      result[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });

    return result;
  }

  clearMetrics() {
    this.metrics.clear();
  }
} 