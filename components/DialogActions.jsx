import React from 'react'
import Button from './Button'

const DialogActions = ({ 
  onCancel, 
  onConfirm, 
  confirmText, 
  confirmDisabled = false,
  className = ''
}) => {
  return (
    <div className={`flex gap-3 justify-end pt-6 ${className}`}>
      <Button
        type="button"
        onClick={onCancel}
        variant="secondary"
      >
        Cancel
      </Button>
      <Button 
        type="submit"
        disabled={confirmDisabled}
        variant="primary"
      >
        {confirmText}
      </Button>
    </div>
  )
}

export default DialogActions
