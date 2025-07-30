import { imageOptimization } from './performance'

// Image optimization configuration
export const IMAGE_CONFIG = {
  // Supported formats in order of preference
  formats: ['webp', 'avif', 'jpg', 'png'] as const,
  
  // Quality settings
  quality: {
    high: 90,
    medium: 75,
    low: 60,
  },
  
  // Size breakpoints for responsive images
  breakpoints: [320, 640, 768, 1024, 1280, 1920] as const,
  
  // Maximum dimensions
  maxWidth: 1920,
  maxHeight: 1080,
  
  // Lazy loading settings
  lazyLoading: {
    rootMargin: '50px',
    threshold: 0.1,
  },
} as const

export type ImageFormat = typeof IMAGE_CONFIG.formats[number]
export type ImageQuality = keyof typeof IMAGE_CONFIG.quality

// Image optimization utilities
export class ImageOptimizer {
  // Generate responsive image sources
  static generateSrcSet(
    baseSrc: string,
    breakpoints: readonly number[] = IMAGE_CONFIG.breakpoints
  ): string {
    return breakpoints
      .map(width => `${baseSrc}?w=${width} ${width}w`)
      .join(', ')
  }

  // Generate sizes attribute for responsive images
  static generateSizes(
    breakpoints: readonly number[] = IMAGE_CONFIG.breakpoints
  ): string {
    const sizeRules = breakpoints.map((width, index) => {
      if (index === breakpoints.length - 1) {
        return `${width}px`
      }
      return `(max-width: ${width}px) ${width}px`
    })
    
    return sizeRules.join(', ')
  }

  // Get optimized image URL
  static getOptimizedUrl(
    src: string,
    options: {
      width?: number
      height?: number
      quality?: ImageQuality
      format?: ImageFormat
    } = {}
  ): string {
    const params = new URLSearchParams()
    
    if (options.width) params.set('w', options.width.toString())
    if (options.height) params.set('h', options.height.toString())
    if (options.quality) params.set('q', IMAGE_CONFIG.quality[options.quality].toString())
    if (options.format) params.set('f', options.format)
    
    const separator = src.includes('?') ? '&' : '?'
    return `${src}${separator}${params.toString()}`
  }

  // Preload critical images
  static preloadImage(src: string, options?: { as?: string; crossorigin?: string }): void {
    if (typeof document === 'undefined') return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = options?.as || 'image'
    link.href = src
    
    if (options?.crossorigin) {
      link.crossOrigin = options.crossorigin
    }
    
    document.head.appendChild(link)
  }

  // Check if WebP is supported
  static supportsWebP(): Promise<boolean> {
    return new Promise(resolve => {
      const webP = new Image()
      webP.onload = () => resolve(webP.width > 0 && webP.height > 0)
      webP.onerror = () => resolve(false)
      webP.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='
    })
  }

  // Get optimal format for browser
  static async getOptimalFormat(): Promise<ImageFormat> {
    // Check for AVIF support (most modern browsers)
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    
    try {
      const avifSupported = canvas.toDataURL('image/avif').startsWith('data:image/avif')
      if (avifSupported) return 'avif'
    } catch {}
    
    // Check for WebP support
    const webpSupported = await ImageOptimizer.supportsWebP()
    if (webpSupported) return 'webp'
    
    // Fallback to JPEG
    return 'jpg'
  }
}

// Lazy loading implementation
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null
  private loadedImages = new Set<string>()

  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        IMAGE_CONFIG.lazyLoading
      )
    }
  }

  // Handle intersection changes
  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        this.loadImage(img)
        this.observer?.unobserve(img)
      }
    })
  }

  // Load image and track performance
  private loadImage(img: HTMLImageElement) {
    const startTime = performance.now()
    const dataSrc = img.dataset.src || img.dataset.srcset
    
    if (!dataSrc || this.loadedImages.has(dataSrc)) return

    const handleLoad = () => {
      const loadTime = performance.now() - startTime
      const imageSize = this.estimateImageSize(img)
      
      imageOptimization.trackImageLoad(dataSrc, loadTime, imageSize)
      this.loadedImages.add(dataSrc)
      
      img.classList.add('loaded')
      img.removeEventListener('load', handleLoad)
      img.removeEventListener('error', handleError)
    }

    const handleError = () => {
      console.error('Failed to load image:', dataSrc)
      img.removeEventListener('load', handleLoad)
      img.removeEventListener('error', handleError)
    }

    img.addEventListener('load', handleLoad)
    img.addEventListener('error', handleError)

    // Load the image
    if (img.dataset.srcset) {
      img.srcset = img.dataset.srcset
      img.sizes = img.dataset.sizes || ''
    }
    if (img.dataset.src) {
      img.src = img.dataset.src
    }
  }

  // Estimate image size for performance tracking
  private estimateImageSize(img: HTMLImageElement): number {
    // Rough estimate based on dimensions and format
    const area = (img.naturalWidth || 0) * (img.naturalHeight || 0)
    const bytesPerPixel = img.src.includes('webp') ? 0.5 : 
                         img.src.includes('avif') ? 0.3 : 1
    return Math.round(area * bytesPerPixel)
  }

  // Observe an image for lazy loading
  observe(img: HTMLImageElement) {
    if (this.observer && img.dataset.src) {
      this.observer.observe(img)
    }
  }

  // Unobserve an image
  unobserve(img: HTMLImageElement) {
    if (this.observer) {
      this.observer.unobserve(img)
    }
  }

  // Destroy the loader
  destroy() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    this.loadedImages.clear()
  }
}

// Global lazy loader instance
export const lazyLoader = new LazyImageLoader()

// React hook for lazy loading images
export function useLazyImage(ref: React.RefObject<HTMLImageElement>) {
  React.useEffect(() => {
    const img = ref.current
    if (img) {
      lazyLoader.observe(img)
      
      return () => {
        lazyLoader.unobserve(img)
      }
    }
  }, [ref])
}

// Image placeholder generation
export const imagePlaceholder = {
  // Generate a blur placeholder
  generateBlurPlaceholder: (width: number, height: number, color: string = '#e5e5e5'): string => {
    // Create a small canvas with blur effect
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(width / 10, 10)
    canvas.height = Math.max(height / 10, 10)
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = color
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    return canvas.toDataURL()
  },

  // Generate a gradient placeholder
  generateGradientPlaceholder: (
    width: number, 
    height: number, 
    colors: string[] = ['#f3f4f6', '#e5e7eb']
  ): string => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1), color)
      })
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    }
    
    return canvas.toDataURL()
  },

  // Generate a skeleton placeholder
  generateSkeletonPlaceholder: (width: number, height: number): string => {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#f3f4f6"/>
            <stop offset="50%" stop-color="#e5e7eb"/>
            <stop offset="100%" stop-color="#f3f4f6"/>
            <animateTransform attributeName="gradientTransform" type="translate" 
              values="-100 0;100 0;-100 0" dur="2s" repeatCount="indefinite"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#shimmer)"/>
      </svg>
    `)}`
  },
}

// Image performance metrics
export const imageMetrics = {
  // Track lazy loading effectiveness
  trackLazyLoadingStats: () => {
    if (typeof document === 'undefined') return

    const allImages = document.querySelectorAll('img')
    const lazyImages = document.querySelectorAll('img[data-src]')
    const viewportImages = Array.from(allImages).filter(img => {
      const rect = img.getBoundingClientRect()
      return rect.top < window.innerHeight && rect.bottom > 0
    })

    imageOptimization.trackLazyLoad(lazyImages.length, viewportImages.length)
  },

  // Get image loading statistics
  getLoadingStats: () => {
    const loadedCount = lazyLoader['loadedImages'].size
    const totalImages = document.querySelectorAll('img[data-src]').length
    
    return {
      loaded: loadedCount,
      total: totalImages,
      percentage: totalImages > 0 ? (loadedCount / totalImages) * 100 : 0,
    }
  },
}

// Export types
export type { ImageFormat, ImageQuality }