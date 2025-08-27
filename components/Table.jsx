import React from 'react'

// Centralized styling constants
const TABLE_STYLES = {
  // Base table styles
  table: 'w-full table-fixed',
  container: 'overflow-x-auto',
  
  // Header styles
  header: {
    base: 'text-left py-3 px-4 font-semibold text-[#171717]',
    // Column width variants
    widths: {
      sm: 'w-16',    // 64px - for small data like Rank
      md: 'w-24',    // 96px - for medium data like ELO, Won, Lost
      lg: 'w-32',    // 128px - for larger data like Player names
      xl: 'w-40',    // 160px - for extra large data like dates
      xxl: 'w-48',   // 192px - for very large data like full names
    }
  },
  
  // Cell styles
  cell: {
    base: 'py-3 px-4 text-gray-900',
    // Text variants
    text: {
      default: '', // inherits base
      muted: 'text-gray-600', // for secondary info like dates
      success: 'text-green-600', // for positive values
      danger: 'text-red-600', // for negative values
    },

  },
  
  // Row styles
  row: {
    base: 'hover:bg-gray-50 transition-colors',
    header: 'border-b border-gray-200',
    special: 'bg-yellow-50', // for highlighting (e.g., 1st place)
  },
  
  // Body styles
  body: 'divide-y divide-gray-100',
}

// Table Header component with configurable width and styling
export const TableHeader = ({ 
  children, 
  width = 'default',
  className = '',
  ...props 
}) => {
  const widthClass = width !== 'default' ? TABLE_STYLES.header.widths[width] : ''
  const classes = `${TABLE_STYLES.header.base} ${widthClass} ${className}`.trim()
  
  return (
    <th className={classes} {...props}>
      {children}
    </th>
  )
}

// Table Cell component with configurable variants
export const TableCell = ({ 
  children, 
  text = 'default',
  className = '',
  ...props 
}) => {
  const textClass = TABLE_STYLES.cell.text[text]
  
  const classes = [
    TABLE_STYLES.cell.base,
    textClass,
    className
  ].filter(Boolean).join(' ')
  
  return (
    <td className={classes} {...props}>
      {children}
    </td>
  )
}

// Table Row component with configurable styling
export const TableRow = ({ 
  children, 
  isHeader = false,
  isSpecial = false,
  className = '',
  ...props 
}) => {
  const baseClass = isHeader ? TABLE_STYLES.row.header : TABLE_STYLES.row.base
  const specialClass = isSpecial ? TABLE_STYLES.row.special : ''
  
  const classes = [baseClass, specialClass, className].filter(Boolean).join(' ')
  
  return (
    <tr className={classes} {...props}>
      {children}
    </tr>
  )
}

// Main Table component
const Table = ({ children, className = '', ...props }) => (
  <table 
    className={`${TABLE_STYLES.table} ${className}`}
    {...props}
  >
    {children}
  </table>
)

// Table Container with consistent styling
export const TableContainer = ({ children, className = '', ...props }) => (
  <div 
    className={`${TABLE_STYLES.container} ${className}`}
    {...props}
  >
    {children}
  </div>
)

// Table Body with consistent styling
export const TableBody = ({ children, className = '', ...props }) => (
  <tbody 
    className={`${TABLE_STYLES.body} ${className}`}
    {...props}
  >
    {children}
  </tbody>
)

// Table Head with consistent styling
export const TableHead = ({ children, className = '', ...props }) => (
  <thead className={className} {...props}>
    {children}
  </thead>
)

export default Table
