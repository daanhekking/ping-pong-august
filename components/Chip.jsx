import React from 'react'

// Chip variants for different states
const CHIP_VARIANTS = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  danger: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
}

// Chip sizes
const CHIP_SIZES = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
}

export default function Chip({ 
  children, 
  variant = 'default',
  size = 'sm',
  className = '',
  ...props 
}) {
  const variantClass = CHIP_VARIANTS[variant] || CHIP_VARIANTS.default
  const sizeClass = CHIP_SIZES[size] || CHIP_SIZES.sm
  
  const classes = [
    'rounded-full font-medium',
    variantClass,
    sizeClass,
    className
  ].filter(Boolean).join(' ')
  
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}
