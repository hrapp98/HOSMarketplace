'use client'

import { useEffect } from 'react'
import { initializeErrorTracking } from '@/lib/client-error-handler'

export function ClientErrorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize client-side error tracking
    initializeErrorTracking()
  }, [])

  return <>{children}</>
}