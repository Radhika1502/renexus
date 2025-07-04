import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { db } from '../../database/db';

/**
 * Frontend Optimization Service for Phase 4 Performance Optimization
 * Implements code splitting and lazy loading, bundle size optimization,
 * client-side caching, and rendering performance improvements
 */
export class FrontendOptimizationService {
  private readonly CACHE_VERSION = '1.0.0';
  private readonly CACHE_NAME = `renexus-cache-${this.CACHE_VERSION}`;
  private readonly MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  /**
   * Generate code splitting configuration for webpack
   */
  generateCodeSplittingConfig(): {
    success: boolean;
    config: any;
    message?: string;
  } {
    try {
      const config = {
        optimization: {
          splitChunks: {
            chunks: 'all',
            maxInitialRequests: 25,
            minSize: 20000,
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name(module: any) {
                  // Get the name of the npm package
                  const packageName = module.context.match(
                    /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                  )[1];
                  
                  // Replace @ symbols and slashes with underscores
                  return `npm.${packageName.replace('@', '').replace('/', '_')}`;
                },
                priority: -10
              },
              default: {
                minChunks: 2,
                priority: -20,
                reuseExistingChunk: true
              }
            }
          },
          runtimeChunk: 'single'
        }
      };
      
      return {
        success: true,
        config
      };
    } catch (error) {
      console.error('Code splitting config generation error:', error);
      return { 
        success: false, 
        config: {},
        message: 'Failed to generate code splitting configuration' 
      };
    }
  }
  
  /**
   * Generate lazy loading routes configuration for React Router
   */
  generateLazyLoadingRoutes(
    routes: Array<{
      path: string;
      component: string;
      priority: 'high' | 'medium' | 'low';
    }>
  ): {
    success: boolean;
    lazyRoutes?: string;
    message?: string;
  } {
    try {
      // Sort routes by priority
      const sortedRoutes = [...routes].sort((a, b) => {
        const priorityMap: Record<string, number> = {
          high: 1,
          medium: 2,
          low: 3
        };
        return priorityMap[a.priority] - priorityMap[b.priority];
      });
      
      // Generate lazy loading code
      const imports = sortedRoutes.map(route => 
        `const ${this.componentNameFromPath(route.component)} = React.lazy(() => import('${route.component}'));`
      ).join('\n');
      
      const routeDefinitions = sortedRoutes.map(route => `
  {
    path: '${route.path}',
    element: (
      <React.Suspense fallback={<LoadingSpinner />}>
        <${this.componentNameFromPath(route.component)} />
      </React.Suspense>
    )
  }`).join(',\n');
      
      const lazyRoutes = `
import React from 'react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

${imports}

export const routes = [${routeDefinitions}
];
`;
      
      return {
        success: true,
        lazyRoutes
      };
    } catch (error) {
      console.error('Lazy loading routes generation error:', error);
      return { 
        success: false, 
        message: 'Failed to generate lazy loading routes' 
      };
    }
  }
  
  /**
   * Analyze bundle size and provide optimization recommendations
   */
  async analyzeBundleSize(
    bundleStatsPath: string
  ): Promise<{
    success: boolean;
    analysis?: {
      totalSize: number;
      chunks: Array<{
        name: string;
        size: number;
        percentage: number;
      }>;
      recommendations: Array<{
        type: string;
        description: string;
        impact: 'high' | 'medium' | 'low';
      }>;
    };
    message?: string;
  }> {
    try {
      // Read bundle stats file
      const statsJson = JSON.parse(fs.readFileSync(bundleStatsPath, 'utf8'));
      
      // Calculate total size
      const totalSize = statsJson.assets.reduce(
        (sum: number, asset: any) => sum + asset.size, 
        0
      );
      
      // Get chunk information
      const chunks = statsJson.assets.map((asset: any) => ({
        name: asset.name,
        size: asset.size,
        percentage: (asset.size / totalSize) * 100
      }));
      
      // Generate recommendations
      const recommendations: Array<{
        type: string;
        description: string;
        impact: 'high' | 'medium' | 'low';
      }> = [];
      
      // Check for large chunks
      const largeChunks = chunks.filter(chunk => chunk.percentage > 10);
      if (largeChunks.length > 0) {
        recommendations.push({
          type: 'large-chunks',
          description: `Consider splitting large chunks: ${largeChunks.map(c => c.name).join(', ')}`,
          impact: 'high'
        });
      }
      
      // Check for duplicate modules
      const moduleNames = new Set();
      const duplicateModules: string[] = [];
      
      statsJson.modules.forEach((module: any) => {
        const name = module.name;
        if (moduleNames.has(name)) {
          duplicateModules.push(name);
        } else {
          moduleNames.add(name);
        }
      });
      
      if (duplicateModules.length > 0) {
        recommendations.push({
          type: 'duplicate-modules',
          description: `Found ${duplicateModules.length} duplicate modules. Consider deduplication.`,
          impact: 'medium'
        });
      }
      
      // Check for large dependencies
      const nodeModulesSize = statsJson.modules
        .filter((module: any) => module.name.includes('node_modules'))
        .reduce((sum: number, module: any) => sum + module.size, 0);
      
      const nodeModulesPercentage = (nodeModulesSize / totalSize) * 100;
      
      if (nodeModulesPercentage > 70) {
        recommendations.push({
          type: 'large-dependencies',
          description: 'Dependencies account for over 70% of bundle size. Consider using smaller alternatives or tree-shaking.',
          impact: 'high'
        });
      }
      
      // Check for missing code splitting
      if (chunks.length < 3) {
        recommendations.push({
          type: 'code-splitting',
          description: 'Consider implementing code splitting to improve initial load time.',
          impact: 'high'
        });
      }
      
      // Check for missing compression
      if (totalSize > 1000000) { // 1MB
        recommendations.push({
          type: 'compression',
          description: 'Enable Gzip or Brotli compression to reduce transfer size.',
          impact: 'high'
        });
      }
      
      // Log analysis
      await this.logPerformanceEvent('system', 'BUNDLE_ANALYSIS', {
        totalSize,
        largeChunksCount: largeChunks.length,
        duplicateModulesCount: duplicateModules.length,
        recommendationsCount: recommendations.length
      });
      
      return {
        success: true,
        analysis: {
          totalSize,
          chunks,
          recommendations
        }
      };
    } catch (error) {
      console.error('Bundle size analysis error:', error);
      return { 
        success: false, 
        message: 'Failed to analyze bundle size' 
      };
    }
  }
  
  /**
   * Generate service worker for client-side caching
   */
  generateServiceWorker(
    cachePaths: string[] = ['/'],
    excludePaths: string[] = ['/api/']
  ): {
    success: boolean;
    serviceWorkerCode?: string;
    message?: string;
  } {
    try {
      const serviceWorkerCode = `
// Renexus Service Worker v${this.CACHE_VERSION}
const CACHE_NAME = '${this.CACHE_NAME}';
const CACHE_PATHS = ${JSON.stringify(cachePaths)};
const EXCLUDE_PATHS = ${JSON.stringify(excludePaths)};

// Install event - cache initial resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service worker installed, caching resources');
        return cache.addAll(CACHE_PATHS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('Service worker clearing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip excluded paths
  if (EXCLUDE_PATHS.some(path => event.request.url.includes(path))) {
    return;
  }
  
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        // Make network request
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the response
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

// Handle cache expiration
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('Cache cleared by application');
    });
  }
});
`;
      
      return {
        success: true,
        serviceWorkerCode
      };
    } catch (error) {
      console.error('Service worker generation error:', error);
      return { 
        success: false, 
        message: 'Failed to generate service worker' 
      };
    }
  }
  
  /**
   * Generate rendering performance optimizations
   */
  generateRenderingOptimizations(): {
    success: boolean;
    optimizations: Array<{
      name: string;
      description: string;
      implementation: string;
    }>;
    message?: string;
  } {
    try {
      const optimizations = [
        {
          name: 'React.memo',
          description: 'Memoize components to prevent unnecessary re-renders',
          implementation: `
// Before
function MyComponent(props) {
  return <div>{props.data}</div>;
}

// After
const MyComponent = React.memo(function MyComponent(props) {
  return <div>{props.data}</div>;
});
`
        },
        {
          name: 'useCallback',
          description: 'Memoize callback functions to prevent unnecessary re-renders',
          implementation: `
// Before
function ParentComponent() {
  const handleClick = () => {
    console.log('Clicked');
  };
  
  return <ChildComponent onClick={handleClick} />;
}

// After
function ParentComponent() {
  const handleClick = React.useCallback(() => {
    console.log('Clicked');
  }, []);
  
  return <ChildComponent onClick={handleClick} />;
}
`
        },
        {
          name: 'useMemo',
          description: 'Memoize expensive calculations to prevent unnecessary recalculations',
          implementation: `
// Before
function MyComponent({ data }) {
  const processedData = processData(data);
  return <div>{processedData}</div>;
}

// After
function MyComponent({ data }) {
  const processedData = React.useMemo(() => {
    return processData(data);
  }, [data]);
  
  return <div>{processedData}</div>;
}
`
        },
        {
          name: 'Virtualization',
          description: 'Render only visible items in long lists',
          implementation: `
// Before
function MyList({ items }) {
  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}

// After
import { FixedSizeList } from 'react-window';

function MyList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );
  
  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={items.length}
      itemSize={35}
    >
      {Row}
    </FixedSizeList>
  );
}
`
        },
        {
          name: 'Code Splitting',
          description: 'Split code into smaller chunks to improve initial load time',
          implementation: `
// Before
import { BigComponent } from './BigComponent';

function App() {
  return (
    <div>
      <BigComponent />
    </div>
  );
}

// After
const BigComponent = React.lazy(() => import('./BigComponent'));

function App() {
  return (
    <div>
      <React.Suspense fallback={<div>Loading...</div>}>
        <BigComponent />
      </React.Suspense>
    </div>
  );
}
`
        }
      ];
      
      return {
        success: true,
        optimizations
      };
    } catch (error) {
      console.error('Rendering optimizations generation error:', error);
      return { 
        success: false, 
        optimizations: [],
        message: 'Failed to generate rendering optimizations' 
      };
    }
  }
  
  /**
   * Extract component name from file path
   */
  private componentNameFromPath(componentPath: string): string {
    const basename = path.basename(componentPath, path.extname(componentPath));
    return basename.replace(/[^a-zA-Z0-9]/g, '');
  }
  
  /**
   * Log performance events for monitoring
   */
  private async logPerformanceEvent(
    userId: string, 
    eventType: string, 
    details: any
  ): Promise<void> {
    await db.insert({
      table: 'performance_logs',
      values: {
        id: uuidv4(),
        userId,
        eventType,
        details: JSON.stringify(details),
        createdAt: new Date()
      }
    });
  }
}

export default new FrontendOptimizationService();
