import { lazy, Suspense } from 'react';

/**
 * Lazy load components with fallback
 */
export function lazyLoadComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  displayName: string
) {
  const Component = lazy(importFunc);
  (Component as any).displayName = displayName;
  return Component;
}

/**
 * Preload component to avoid loading delay
 */
export function preloadComponent(
  importFunc: () => Promise<{ default: any }>
) {
  importFunc().catch(err => console.error('Preload error:', err));
}

/**
 * Intersection Observer for lazy loading images
 */
export function observeImages(container: HTMLElement | null) {
  if (!container) return;

  const images = container.querySelectorAll('img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for older browsers
    images.forEach(img => {
      const src = img.getAttribute('data-src');
      if (src) {
        (img as HTMLImageElement).src = src;
      }
    });
  }
}

/**
 * Lazy load external scripts
 */
export function loadScript(src: string, attributes: Record<string, string> = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    
    Object.entries(attributes).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  });
}

/**
 * Prefetch resources
 */
export function prefetchResource(href: string, as: string = 'script') {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Preconnect to external domains
 */
export function preconnectDomain(origin: string) {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  document.head.appendChild(link);
}

/**
 * DNS prefetch for external domains
 */
export function dnsPrefetch(origin: string) {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = origin;
  document.head.appendChild(link);
}
