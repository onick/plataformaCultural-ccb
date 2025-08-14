import { useEffect, useRef, useCallback } from 'react'
import { useNotificationStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'

interface PollingConfig {
  baseInterval: number // Base polling interval in milliseconds
  maxInterval: number  // Maximum interval for backoff
  backoffMultiplier: number // Multiplier for exponential backoff
  maxRetries: number   // Maximum consecutive failures before giving up
  enableVisibilityOptimization: boolean // Reduce polling when tab is hidden
}

const defaultConfig: PollingConfig = {
  baseInterval: 30000, // 30 seconds
  maxInterval: 300000, // 5 minutes
  backoffMultiplier: 2,
  maxRetries: 5,
  enableVisibilityOptimization: true,
}

export const useNotificationPolling = (config: Partial<PollingConfig> = {}) => {
  const fullConfig = { ...defaultConfig, ...config }
  
  const { 
    fetchNotifications, 
    isPolling, 
    startPolling: storeStartPolling,
    stopPolling: storeStopPolling,
    increaseBackoff,
    resetBackoff
  } = useNotificationStore()
  
  const { user, isAuthenticated } = useAuthStore()
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentIntervalRef = useRef(fullConfig.baseInterval)
  const failureCountRef = useRef(0)
  const isDocumentVisibleRef = useRef(true)
  const lastSuccessfulPollRef = useRef<Date | null>(null)

  // Clear any existing timeout
  const clearCurrentTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Handle successful poll
  const handlePollSuccess = useCallback(() => {
    failureCountRef.current = 0
    currentIntervalRef.current = fullConfig.baseInterval
    lastSuccessfulPollRef.current = new Date()
    resetBackoff()
  }, [fullConfig.baseInterval, resetBackoff])

  // Handle poll failure
  const handlePollFailure = useCallback((error: Error) => {
    failureCountRef.current += 1
    
    if (failureCountRef.current >= fullConfig.maxRetries) {
      console.error('Max polling retries reached, stopping polling:', error)
      storeStopPolling()
      return false // Stop polling
    }

    // Exponential backoff
    currentIntervalRef.current = Math.min(
      currentIntervalRef.current * fullConfig.backoffMultiplier,
      fullConfig.maxInterval
    )
    
    increaseBackoff()
    console.warn(`Polling failed (attempt ${failureCountRef.current}), backing off to ${currentIntervalRef.current}ms:`, error)
    
    return true // Continue polling
  }, [fullConfig.maxRetries, fullConfig.backoffMultiplier, fullConfig.maxInterval, increaseBackoff, storeStopPolling])

  // Main polling function
  const poll = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return
    }

    try {
      await fetchNotifications()
      handlePollSuccess()
    } catch (error) {
      const shouldContinue = handlePollFailure(error as Error)
      if (!shouldContinue) {
        return // Stop polling
      }
    }

    // Schedule next poll if still polling
    if (isPolling) {
      // Adjust interval based on document visibility
      let nextInterval = currentIntervalRef.current
      
      if (fullConfig.enableVisibilityOptimization && !isDocumentVisibleRef.current) {
        // Increase interval when tab is hidden
        nextInterval = Math.min(nextInterval * 2, fullConfig.maxInterval)
      }

      timeoutRef.current = setTimeout(poll, nextInterval)
    }
  }, [
    isAuthenticated, 
    user, 
    fetchNotifications, 
    handlePollSuccess, 
    handlePollFailure, 
    isPolling,
    fullConfig.enableVisibilityOptimization,
    fullConfig.maxInterval
  ])

  // Start polling
  const startPolling = useCallback(() => {
    if (!isAuthenticated || !user) {
      console.warn('Cannot start polling: user not authenticated')
      return
    }

    if (isPolling) {
      console.warn('Polling already active')
      return
    }

    console.log('Starting notification polling...')
    storeStartPolling()
    
    // Reset state
    failureCountRef.current = 0
    currentIntervalRef.current = fullConfig.baseInterval
    
    // Start immediate poll
    poll()
  }, [isAuthenticated, user, isPolling, storeStartPolling, fullConfig.baseInterval, poll])

  // Stop polling
  const stopPolling = useCallback(() => {
    console.log('Stopping notification polling...')
    clearCurrentTimeout()
    storeStopPolling()
  }, [clearCurrentTimeout, storeStopPolling])

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    isDocumentVisibleRef.current = !document.hidden
    
    if (fullConfig.enableVisibilityOptimization && isPolling) {
      if (isDocumentVisibleRef.current) {
        // Tab became visible - check if we need to poll immediately
        const now = new Date()
        const timeSinceLastPoll = lastSuccessfulPollRef.current 
          ? (now.getTime() - lastSuccessfulPollRef.current.getTime())
          : Infinity

        // If it's been longer than the base interval, poll immediately
        if (timeSinceLastPoll > fullConfig.baseInterval) {
          clearCurrentTimeout()
          poll()
        }
      }
      // When tab becomes hidden, polling will automatically slow down on next iteration
    }
  }, [fullConfig.enableVisibilityOptimization, fullConfig.baseInterval, isPolling, poll, clearCurrentTimeout])

  // Handle online/offline events
  const handleOnlineChange = useCallback(() => {
    if (navigator.onLine && isPolling) {
      // Came back online - resume normal polling
      console.log('Network restored, resuming normal polling')
      failureCountRef.current = 0
      currentIntervalRef.current = fullConfig.baseInterval
      clearCurrentTimeout()
      poll()
    }
  }, [isPolling, fullConfig.baseInterval, poll, clearCurrentTimeout])

  // Setup effects
  useEffect(() => {
    if (isAuthenticated && user) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [isAuthenticated, user, startPolling, stopPolling])

  // Visibility change listener
  useEffect(() => {
    if (fullConfig.enableVisibilityOptimization) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [fullConfig.enableVisibilityOptimization, handleVisibilityChange])

  // Online/offline listeners
  useEffect(() => {
    window.addEventListener('online', handleOnlineChange)
    window.addEventListener('offline', () => {
      console.log('Network lost, polling will continue with backoff on failures')
    })

    return () => {
      window.removeEventListener('online', handleOnlineChange)
      window.removeEventListener('offline', () => {})
    }
  }, [handleOnlineChange])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCurrentTimeout()
    }
  }, [clearCurrentTimeout])

  // Return control functions and status
  return {
    startPolling,
    stopPolling,
    isPolling,
    currentInterval: currentIntervalRef.current,
    failureCount: failureCountRef.current,
    lastSuccessfulPoll: lastSuccessfulPollRef.current,
    isDocumentVisible: isDocumentVisibleRef.current,
    
    // Force immediate poll (useful for manual refresh)
    pollNow: useCallback(() => {
      if (isAuthenticated && user) {
        clearCurrentTimeout()
        poll()
      }
    }, [isAuthenticated, user, clearCurrentTimeout, poll]),
    
    // Reset polling state (useful for recovering from errors)
    resetPolling: useCallback(() => {
      failureCountRef.current = 0
      currentIntervalRef.current = fullConfig.baseInterval
      resetBackoff()
      
      if (isPolling) {
        clearCurrentTimeout()
        poll()
      }
    }, [fullConfig.baseInterval, resetBackoff, isPolling, clearCurrentTimeout, poll])
  }
}