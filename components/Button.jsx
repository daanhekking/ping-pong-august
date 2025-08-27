import React from 'react'

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  className = '',
  ...props 
}) => {
  const baseClasses = 'px-4 py-2 font-medium rounded-full focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed button-text'
  
  const variants = {
    primary: 'bg-[#171717] text-white hover:bg-gray-800 focus:ring-[#171717]',
    secondary: 'border border-[#171717] text-[#171717] hover:bg-[#171717] hover:text-white focus:ring-[#171717]'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-4 py-2'
  }
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`
  
  return (
    <button 
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
