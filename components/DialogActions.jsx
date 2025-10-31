import React from 'react'
import Button from './Button'

const DialogActions = ({ 
  onCancel, 
  onConfirm, 
  confirmText, 
  confirmDisabled = false,
  loading = false,
  className = ''
}) => {
  return (
    <div className={`flex gap-3 justify-end pt-6 ${className}`}>
      <Button
        type="button"
        onClick={onCancel}
        variant="secondary"
        disabled={loading}
      >
        Cancel
      </Button>
      <Button 
        type="submit"
        disabled={confirmDisabled || loading}
        variant="primary"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {confirmText}
          </div>
        ) : (
          confirmText
        )}
      </Button>
    </div>
  )
}

export default DialogActions
