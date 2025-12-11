import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Performance Monitoring Utilities
 * 
 * Tracks Core Web Vitals and custom performance metrics
 * Integrates with Firebase Performance Monitoring
 */

// Types
interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface ResourceAnalysis {
  totalSize: number;
  imageSize: number;
  scriptSize: number;
  styleSize: number;
  slowResources: Array<{
    name: string;
    duration: number;
    size: number;
  }>;
}

// Core Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 }, // INP replaced FID
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

// Get rating based on value and thresholds
const getRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

// Format metric for logging
const formatMetric = (metric: Metric): PerformanceMetric => {
  return {
    name: metric.name,
    value: Math.round(metric.value),
    rating: getRating(metric.name, metric.value),
    timestamp: Date.now(),
  };
};

// Log metric to console with color coding
const logMetric = (metric: PerformanceMetric) => {
  const colors = {
    good: '🟢',
    'needs-improvement': '🟡',
    poor: '🔴',
  };
  
  const icon = colors[metric.rating];
  console.log(
    `${icon} ${metric.name}: ${metric.value}ms (${metric.rating})`,
    metric
  );
};

// Send metric to analytics (can be extended for GA, Firebase, etc.)
const sendToAnalytics = (metric: PerformanceMetric) => {
  // Example: Send to Firebase Performance Monitoring
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.rating,
      value: metric.value,
      non_interaction: true,
    });
  }
  
  // Example: Send to custom endpoint
  if (navigator.sendBeacon && process.env.NODE_ENV === 'production') {
    const data = JSON.stringify(metric);
    navigator.sendBeacon('/api/analytics', data);
  }
};

// Initialize Core Web Vitals monitoring
export const initPerformanceMonitoring = () => {
  const handleMetric = (metric: Metric) => {
    const formatted = formatMetric(metric);
    logMetric(formatted);
    sendToAnalytics(formatted);
  };

  // Track Core Web Vitals
  onCLS(handleMetric);
  onINP(handleMetric); // INP replaced FID in web-vitals v4
  onFCP(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);

  // Log initialization
  console.log('📊 Performance monitoring initialized');
};

// Custom performance marks
export const markPerformance = (name: string) => {
  if ('performance' in window && 'mark' in performance) {
    performance.mark(name);
  }
};

// Measure performance between two marks
export const measurePerformance = (name: string, startMark: string, endMark?: string) => {
  if ('performance' in window && 'measure' in performance) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      
      if (measure) {
        const metric: PerformanceMetric = {
          name,
          value: Math.round(measure.duration),
          rating: measure.duration < 1000 ? 'good' : measure.duration < 3000 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
        };
        
        logMetric(metric);
        return metric;
      }
    } catch (error) {
      console.warn('Performance measurement failed:', error);
    }
  }
  return null;
};

// Analyze resource loading performance
export const analyzeResourceTiming = (): ResourceAnalysis => {
  if (!('performance' in window)) {
    return {
      totalSize: 0,
      imageSize: 0,
      scriptSize: 0,
      styleSize: 0,
      slowResources: [],
    };
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const analysis: ResourceAnalysis = {
    totalSize: 0,
    imageSize: 0,
    scriptSize: 0,
    styleSize: 0,
    slowResources: [],
  };
  
  resources.forEach((resource) => {
    const size = resource.transferSize || 0;
    analysis.totalSize += size;
    
    // Categorize by type
    if (resource.name.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i)) {
      analysis.imageSize += size;
    } else if (resource.name.match(/\.js$/i)) {
      analysis.scriptSize += size;
    } else if (resource.name.match(/\.css$/i)) {
      analysis.styleSize += size;
    }
    
    // Flag slow resources (>500ms)
    if (resource.duration > 500) {
      analysis.slowResources.push({
        name: resource.name.split('/').pop() || resource.name,
        duration: Math.round(resource.duration),
        size: Math.round(size / 1024), // KB
      });
    }
  });
  
  // Sort slow resources by duration
  analysis.slowResources.sort((a, b) => b.duration - a.duration);
  
  return analysis;
};

// Log resource analysis to console
export const logResourceAnalysis = () => {
  const analysis = analyzeResourceTiming();
  
  console.group('📦 Resource Loading Analysis');
  console.log('Total Size:', (analysis.totalSize / 1024 / 1024).toFixed(2), 'MB');
  console.log('Images:', (analysis.imageSize / 1024).toFixed(2), 'KB');
  console.log('Scripts:', (analysis.scriptSize / 1024).toFixed(2), 'KB');
  console.log('Styles:', (analysis.styleSize / 1024).toFixed(2), 'KB');
  
  if (analysis.slowResources.length > 0) {
    console.warn('🐌 Slow Resources (>500ms):');
    console.table(analysis.slowResources);
  }
  
  console.groupEnd();
  
  return analysis;
};

// Track navigation timing
export const getNavigationTiming = () => {
  if (!('performance' in window)) return null;
  
  const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (!perfData) return null;
  
  return {
    // DNS lookup
    dnsTime: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
    
    // TCP connection
    tcpTime: Math.round(perfData.connectEnd - perfData.connectStart),
    
    // Request/Response
    requestTime: Math.round(perfData.responseStart - perfData.requestStart),
    responseTime: Math.round(perfData.responseEnd - perfData.responseStart),
    
    // DOM processing
    domParseTime: Math.round(perfData.domInteractive - perfData.domLoading),
    domContentLoadedTime: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
    
    // Full page load
    pageLoadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
    
    // Time to First Byte
    ttfb: Math.round(perfData.responseStart - perfData.fetchStart),
  };
};

// Log navigation timing
export const logNavigationTiming = () => {
  const timing = getNavigationTiming();
  
  if (!timing) {
    console.warn('Navigation timing not available');
    return;
  }
  
  console.group('🚀 Navigation Timing');
  console.log('DNS Lookup:', timing.dnsTime, 'ms');
  console.log('TCP Connection:', timing.tcpTime, 'ms');
  console.log('Request:', timing.requestTime, 'ms');
  console.log('Response:', timing.responseTime, 'ms');
  console.log('DOM Parse:', timing.domParseTime, 'ms');
  console.log('DOM Content Loaded:', timing.domContentLoadedTime, 'ms');
  console.log('Page Load:', timing.pageLoadTime, 'ms');
  console.log('TTFB:', timing.ttfb, 'ms');
  console.groupEnd();
  
  return timing;
};

// Check if image optimization is applied
export const checkImageOptimization = () => {
  const images = document.querySelectorAll('img[src*="cloudinary"]');
  const issues: string[] = [];
  
  images.forEach((img, index) => {
    const src = img.getAttribute('src') || '';
    
    if (!src.includes('f_auto')) {
      issues.push(`Image ${index + 1}: Missing f_auto (auto-format)`);
    }
    if (!src.includes('q_auto')) {
      issues.push(`Image ${index + 1}: Missing q_auto (quality optimization)`);
    }
    if (!img.getAttribute('loading')) {
      issues.push(`Image ${index + 1}: Missing loading="lazy"`);
    }
  });
  
  if (issues.length > 0) {
    console.group('⚠️ Image Optimization Issues');
    issues.forEach(issue => console.warn(issue));
    console.groupEnd();
  } else {
    console.log('✅ All images optimized');
  }
  
  return issues;
};

// Run complete performance audit
export const runPerformanceAudit = () => {
  console.group('🔍 Performance Audit');
  
  // Navigation timing
  logNavigationTiming();
  
  // Resource analysis
  logResourceAnalysis();
  
  // Image optimization
  checkImageOptimization();
  
  console.groupEnd();
  
  console.log('💡 Tip: Run Lighthouse for complete audit');
};

// Hook for React components
export const usePerformanceMonitor = (componentName: string) => {
  const startMark = `${componentName}-start`;
  const endMark = `${componentName}-end`;
  
  // Mark component mount
  markPerformance(startMark);
  
  return {
    complete: () => {
      markPerformance(endMark);
      measurePerformance(`${componentName}-render`, startMark, endMark);
    },
  };
};

// Export all utilities
export default {
  initPerformanceMonitoring,
  markPerformance,
  measurePerformance,
  analyzeResourceTiming,
  logResourceAnalysis,
  getNavigationTiming,
  logNavigationTiming,
  checkImageOptimization,
  runPerformanceAudit,
  usePerformanceMonitor,
};
