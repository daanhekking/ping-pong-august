import React, { useState, useEffect } from 'react'
import DialogActions from './DialogActions'

export default function AddPlayerDialog({
  isOpen,
  onClose,
  onSubmit,
  players = []
}) {
  const [newPlayerName, setNewPlayerName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [animation, setAnimation] = useState(false)

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey)
      // Trigger animation after a brief delay
      setTimeout(() => setAnimation(true), 10)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [isOpen, onClose])

  const handleClose = () => {
    setAnimation(false)
    setTimeout(() => {
      onClose()
      setNewPlayerName('')
      setErrorMsg('')
    }, 200)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newPlayerName.trim()) {
      setErrorMsg('Player name cannot be empty')
      return
    }
    
    // Check if player name already exists
    const existingPlayer = players.find(p => 
      p.name.toLowerCase() === newPlayerName.trim().toLowerCase()
    )
    if (existingPlayer) {
      setErrorMsg(`Player name "${newPlayerName.trim()}" is already taken`)
      return
    }
    
    setErrorMsg('')
    try {
      await onSubmit({ name: newPlayerName.trim() })
      setNewPlayerName('')
      handleClose()
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className={`fixed inset-0 bg-black transition-all duration-200 ease-out ${
        animation ? 'bg-opacity-30' : 'bg-opacity-0'
      } flex items-center justify-center z-50 p-4`}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-200 ease-out ${
          animation 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add New Player</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter player name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#171717] focus:border-[#171717] transition-colors"
          />
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 sm:p-4">
              <p className="body-medium text-red-800">{errorMsg}</p>
            </div>
          )}
          <DialogActions
            onCancel={handleClose}
            onConfirm={() => {}}
            confirmText="Add Player"
            confirmDisabled={!newPlayerName.trim()}
          />
        </form>
      </div>
    </div>
  )
}

