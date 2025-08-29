'use client'

import React, { useEffect, useState } from 'react'

export default function Toast({ message, type = 'success', duration = 4000, onRemove }) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Auto-remove toast after duration
    const timer = setTimeout(() => {
      handleRemove()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onRemove])

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      if (onRemove) onRemove()
    }, 300) // Match transition duration
  }

  const getToastStyles = () => {
    const baseStyles = "px-6 py-3 rounded-lg shadow-lg text-white font-medium transform transition-all duration-300"
    
    const typeStyles = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    }

    const animationStyles = isExiting 
      ? 'scale-95 opacity-0 translate-x-full' 
      : 'scale-100 opacity-100 translate-x-0'

    return `${baseStyles} ${typeStyles[type] || typeStyles.info} ${animationStyles}`
  }

  if (!isVisible) return null

  return (
    <div className={getToastStyles()}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button
          onClick={handleRemove}
          className="ml-4 text-white hover:text-white/80 transition-colors p-1 rounded-full hover:bg-white/20"
          aria-label="Close toast"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Toast Container component to manage multiple toasts
export function ToastContainer({ toasts, onRemoveToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onRemove={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  )
}

