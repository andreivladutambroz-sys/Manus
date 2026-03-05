/**
 * Mobile Performance Optimization Utilities
 * Provides lazy loading, image optimization, and network detection
 */

/**
 * Network information detection
 */
export const useNetworkInformation = () => {
  if (typeof navigator === "undefined") {
    return { effectiveType: "4g", saveData: false };
  }

  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  if (!connection) {
    return { effectiveType: "4g", saveData: false };
  }

  return {
    effectiveType: connection.effectiveType || "4g",
    saveData: connection.saveData || false,
    downlink: connection.downlink,
    rtt: connection.rtt,
  };
};

/**
 * Check if on slow network
 */
export const isSlowNetwork = () => {
  const { effectiveType, saveData } = useNetworkInformation();
  return saveData || effectiveType === "slow-2g" || effectiveType === "2g" || effectiveType === "3g";
};

/**
 * Optimize image for network speed
 */
export const getOptimizedImageUrl = (url: string, width: number, quality: "high" | "medium" | "low" = "medium") => {
  // For demonstration - in production, use a CDN with image optimization
  const qualityMap = {
    high: "q=90",
    medium: "q=75",
    low: "q=50",
  };

  if (isSlowNetwork()) {
    return `${url}?w=${width}&${qualityMap.low}&auto=format`;
  }

  return `${url}?w=${width}&${qualityMap[quality]}&auto=format`;
};

/**
 * Lazy load images
 */
export const useLazyLoadImages = () => {
  const observerOptions = {
    root: null,
    rootMargin: "50px",
    threshold: 0.01,
  };

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          imageObserver.unobserve(img);
        }
      }
    });
  }, observerOptions);

  return { imageObserver };
};

/**
 * Debounce function for mobile events
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for mobile events
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Request idle callback polyfill
 */
export const scheduleIdleTask = (callback: () => void) => {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(callback);
  } else {
    setTimeout(callback, 1);
  }
};

/**
 * Prefetch resources
 */
export const prefetchResource = (url: string, as: "image" | "script" | "style" = "image") => {
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = as;
  link.href = url;
  document.head.appendChild(link);
};

/**
 * Preload resources
 */
export const preloadResource = (url: string, as: "image" | "script" | "style" = "image") => {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = as;
  link.href = url;
  document.head.appendChild(link);
};

/**
 * Cache API helper
 */
export const cacheResponse = async (key: string, response: Response) => {
  if ("caches" in window) {
    const cache = await caches.open("mechanic-helper-v1");
    await cache.put(key, response.clone());
  }
};

/**
 * Get cached response
 */
export const getCachedResponse = async (key: string) => {
  if ("caches" in window) {
    const cache = await caches.open("mechanic-helper-v1");
    return await cache.match(key);
  }
  return null;
};

/**
 * Compress data before sending
 */
export const compressData = (data: any): string => {
  // In production, use a library like lz-string
  return JSON.stringify(data);
};

/**
 * Decompress data after receiving
 */
export const decompressData = (data: string): any => {
  // In production, use a library like lz-string
  return JSON.parse(data);
};

/**
 * Batch API requests
 */
export const batchRequests = async (requests: Array<{ url: string; method?: string }>) => {
  const results = [];
  for (const req of requests) {
    try {
      const response = await fetch(req.url, { method: req.method || "GET" });
      results.push(await response.json());
    } catch (error) {
      results.push({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
  return results;
};

/**
 * Adaptive loading based on network
 */
export const getAdaptiveLoadingStrategy = () => {
  const { effectiveType, saveData } = useNetworkInformation();

  return {
    // Load high-quality assets on fast networks
    loadHighQuality: !saveData && (effectiveType === "4g"),
    // Disable autoplay on slow networks
    autoplay: !saveData && effectiveType !== "slow-2g" && effectiveType !== "2g",
    // Reduce animation on slow networks
    reduceMotion: saveData || effectiveType === "3g",
    // Lazy load images on slow networks
    lazyLoadImages: saveData || effectiveType !== "4g",
    // Reduce initial bundle size on slow networks
    minimalBundle: saveData || effectiveType === "slow-2g" || effectiveType === "2g",
  };
};

/**
 * Monitor performance metrics
 */
export const reportPerformanceMetrics = () => {
  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log("Performance metric:", {
            name: entry.name,
            duration: (entry as any).duration,
            startTime: entry.startTime,
          });
        }
      });

      observer.observe({ entryTypes: ["navigation", "resource", "paint"] });
      return observer;
    } catch (error) {
      console.error("Performance observer error:", error);
    }
  }
  return null;
};

/**
 * Get Core Web Vitals
 */
export const getCoreWebVitals = async () => {
  const vitals = {
    fcp: 0, // First Contentful Paint
    lcp: 0, // Largest Contentful Paint
    cls: 0, // Cumulative Layout Shift
    tti: 0, // Time to Interactive
  };

  if ("PerformanceObserver" in window) {
    try {
      // FCP
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          vitals.fcp = entries[0].startTime;
        }
      });
      fcpObserver.observe({ entryTypes: ["paint"] });

      // LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          vitals.lcp = entries[entries.length - 1].startTime;
        }
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

      // CLS
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            vitals.cls += (entry as any).value;
          }
        }
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (error) {
      console.error("Web Vitals observer error:", error);
    }
  }

  return vitals;
};

/**
 * Memory optimization
 */
export const getMemoryInfo = () => {
  if ("memory" in performance) {
    return {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
    };
  }
  return null;
};

/**
 * Clear unused cache
 */
export const clearOldCache = async (maxAge: number = 7 * 24 * 60 * 60 * 1000) => {
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const date = new Date(response.headers.get("date") || 0).getTime();
          if (Date.now() - date > maxAge) {
            await cache.delete(request);
          }
        }
      }
    }
  }
};
