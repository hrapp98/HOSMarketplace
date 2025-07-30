'use client'

import { useState, useRef, useEffect } from 'react'
import { ImageOptimizer, useLazyImage, imagePlaceholder, type ImageQuality, type ImageFormat } from '@/lib/image-optimization'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  quality?: ImageQuality
  format?: ImageFormat
  lazy?: boolean
  placeholder?: 'blur' | 'gradient' | 'skeleton' | string
  placeholderColors?: string[]
  className?: string
  priority?: boolean
  sizes?: string
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 'medium',
  format,
  lazy = true,
  placeholder = 'skeleton',
  placeholderColors,
  className,
  priority = false,
  sizes,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [optimalFormat, setOptimalFormat] = useState<ImageFormat | undefined>(format)
  const imgRef = useRef<HTMLImageElement>(null)

  // Use lazy loading hook if lazy loading is enabled
  useLazyImage(imgRef)

  // Determine optimal format on mount
  useEffect(() => {
    if (!format) {
      ImageOptimizer.getOptimalFormat().then(setOptimalFormat)
    }
  }, [format])

  // Preload critical images
  useEffect(() => {
    if (priority && !lazy) {
      const optimizedSrc = ImageOptimizer.getOptimizedUrl(src, {
        width,
        height,
        quality,
        format: optimalFormat,
      })
      ImageOptimizer.preloadImage(optimizedSrc)
    }
  }, [src, width, height, quality, optimalFormat, priority, lazy])

  // Generate placeholder
  const getPlaceholder = (): string => {
    if (!width || !height) return ''
    
    switch (placeholder) {
      case 'blur':
        return imagePlaceholder.generateBlurPlaceholder(
          width, 
          height, 
          placeholderColors?.[0]
        )
      case 'gradient':
        return imagePlaceholder.generateGradientPlaceholder(
          width, 
          height, 
          placeholderColors || ['#f3f4f6', '#e5e7eb']
        )
      case 'skeleton':
        return imagePlaceholder.generateSkeletonPlaceholder(width, height)
      default:
        return typeof placeholder === 'string' ? placeholder : ''
    }
  }

  // Generate optimized URLs
  const optimizedSrc = ImageOptimizer.getOptimizedUrl(src, {
    width,
    height,
    quality,
    format: optimalFormat,
  })

  const srcSet = width 
    ? ImageOptimizer.generateSrcSet(src)
    : undefined

  const imageSizes = sizes || (width ? ImageOptimizer.generateSizes() : undefined)

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  // Error fallback
  if (hasError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-gray-200 text-gray-400',
          className
        )}
        style={{ width, height }}
      >
        <svg 
          className="w-8 h-8" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder */}
      {!isLoaded && placeholder && (
        <div 
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            backgroundImage: `url(${getPlaceholder()})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          lazy && 'lazy'
        )}
        onLoad={handleLoad}
        onError={handleError}
        // Use data attributes for lazy loading
        {...(lazy ? {
          'data-src': optimizedSrc,
          'data-srcset': srcSet,
          'data-sizes': imageSizes,
        } : {
          src: optimizedSrc,
          srcSet: srcSet,
          sizes: imageSizes,
        })}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  )
}

// Avatar component with optimization
interface OptimizedAvatarProps {
  src?: string | null
  alt: string
  size?: number
  fallback?: string
  className?: string
}

export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  fallback,
  className,
}: OptimizedAvatarProps) {
  const [hasError, setHasError] = useState(false)

  const getFallbackContent = () => {
    if (fallback) return fallback
    return alt.charAt(0).toUpperCase()
  }

  if (!src || hasError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-gray-300 text-gray-600 font-medium rounded-full',
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {getFallbackContent()}
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      quality="high"
      lazy={false}
      priority
      placeholder="blur"
      className={cn('rounded-full', className)}
      onError={() => setHasError(true)}
    />
  )
}

// Hero image component with advanced optimization
interface HeroImageProps {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

export function HeroImage({ src, alt, className, priority = true }: HeroImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      quality="high"
      lazy={!priority}
      priority={priority}
      placeholder="gradient"
      placeholderColors={['#1f2937', '#374151']}
      sizes="100vw"
      className={cn('w-full h-full object-cover', className)}
    />
  )
}

// Gallery image component
interface GalleryImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  onClick?: () => void
}

export function GalleryImage({ 
  src, 
  alt, 
  width = 300, 
  height = 200, 
  className,
  onClick,
}: GalleryImageProps) {
  return (
    <div 
      className={cn('cursor-pointer transition-transform hover:scale-105', className)}
      onClick={onClick}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        quality="medium"
        lazy
        placeholder="skeleton"
        className="rounded-lg"
      />
    </div>
  )
}

// Background image component
interface BackgroundImageProps {
  src: string
  alt: string
  children?: React.ReactNode
  className?: string
  overlay?: boolean
  overlayOpacity?: number
}

export function BackgroundImage({ 
  src, 
  alt, 
  children, 
  className,
  overlay = false,
  overlayOpacity = 0.5,
}: BackgroundImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={1920}
        height={1080}
        quality="medium"
        lazy
        placeholder="gradient"
        className="absolute inset-0 w-full h-full object-cover"
        onLoad={() => setIsLoaded(true)}
      />
      
      {overlay && isLoaded && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  )
}