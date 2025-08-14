"use client"

import { useState, useEffect } from 'react'
import { AlertCircle, X, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorLog {
  id: string
  timestamp: string
  error: string
  context: string
  stack?: string
  url?: string
  userAgent?: string
}

export function ErrorLogger() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)

  useEffect(() => {
    // Generate unique ID
    let errorCounter = 0
    const generateUniqueId = () => `${Date.now()}-${++errorCounter}`
    
    // Listen for global errors
    const handleError = (event: ErrorEvent) => {
      const errorLog: ErrorLog = {
        id: generateUniqueId(),
        timestamp: new Date().toISOString(),
        error: event.message,
        context: `${event.filename}:${event.lineno}:${event.colno}`,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
      
      setErrors(prev => [errorLog, ...prev].slice(0, 50)) // Keep only last 50 errors
      setIsVisible(true)
      
      // Log to console for debugging
      console.error('🚨 Frontend Error Logged:', errorLog)
    }

    // Listen for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorLog: ErrorLog = {
        id: generateUniqueId(),
        timestamp: new Date().toISOString(),
        error: event.reason?.message || String(event.reason),
        context: 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
      
      setErrors(prev => [errorLog, ...prev].slice(0, 50))
      setIsVisible(true)
      
      console.error('🚨 Promise Rejection Logged:', errorLog)
    }

    // Add custom error logger to window
    window.logError = (error: string, context: string, additionalInfo?: any) => {
      const errorLog: ErrorLog = {
        id: generateUniqueId(),
        timestamp: new Date().toISOString(),
        error,
        context,
        stack: additionalInfo?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
      
      setErrors(prev => [errorLog, ...prev].slice(0, 50))
      setIsVisible(true)
      
      console.error('🚨 Manual Error Logged:', errorLog, additionalInfo)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  const clearErrors = () => {
    setErrors([])
    setIsVisible(false)
  }

  const copyToClipboard = (errorLog: ErrorLog) => {
    const text = JSON.stringify(errorLog, null, 2)
    navigator.clipboard.writeText(text)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-3 border-b border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="font-semibold text-red-800">
              Errores Detectados ({errors.length})
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0"
            >
              {isMinimized ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {!isMinimized && (
          <div className="p-3">
            <div className="flex space-x-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={clearErrors}
                className="text-xs"
              >
                Limpiar Todo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(errors[0])}
                disabled={errors.length === 0}
                className="text-xs"
              >
                Copiar Último Error
              </Button>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {errors.map((error) => (
                <div
                  key={error.id}
                  className="bg-white p-3 rounded border border-red-200 text-sm"
                >
                  <div className="font-medium text-red-800 mb-1">
                    {error.error}
                  </div>
                  <div className="text-gray-600 text-xs mb-1">
                    {error.context}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {new Date(error.timestamp).toLocaleString()}
                  </div>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-500">
                        Ver Stack Trace
                      </summary>
                      <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(error)}
                    className="mt-2 text-xs h-6"
                  >
                    Copiar Error
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Extend window type to include our custom error logger
declare global {
  interface Window {
    logError?: (error: string, context: string, additionalInfo?: any) => void
  }
}