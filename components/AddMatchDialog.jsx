import React, { useState, useEffect } from 'react'
import DialogActions from './DialogActions'

export default function AddMatchDialog({
  isOpen,
  onClose,
  onSubmit,
  players = []
}) {
  const [player1Id, setPlayer1Id] = useState('')
  const [player2Id, setPlayer2Id] = useState('')
  const [player1Score, setPlayer1Score] = useState(0)
  const [player2Score, setPlayer2Score] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [animation, setAnimation] = useState(false)

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose()
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
  }, [isOpen])

  const handleClose = () => {
    setAnimation(false)
    setTimeout(() => {
      onClose()
      // Reset form state
      setPlayer1Id('')
      setPlayer2Id('')
      setPlayer1Score(0)
      setPlayer2Score(0)
      setErrorMsg('')
    }, 200)
  }

  const canSubmitMatch = () => {
    return player1Id && player2Id && player1Id !== player2Id && (player1Score > 0 || player2Score > 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!player1Id || !player2Id) {
      setErrorMsg('Please select both players')
      return
    }
    
    if (player1Id === player2Id) {
      setErrorMsg('Cannot play against yourself')
      return
    }
    
    if (player1Score === player2Score) {
      setErrorMsg('Scores cannot be tied - someone must win!')
      return
    }
    
    setErrorMsg('')
    
    try {
      await onSubmit({
        player1_id: player1Id,
        player2_id: player2Id,
        player1_score: player1Score,
        player2_score: player2Score,
        winner_id: player1Score > player2Score ? player1Id : player2Id,
      })
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
        className={`bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 transform transition-all duration-200 ease-out ${
          animation 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add New Match</h3>
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
          <div className="flex flex-col lg:flex-row gap-4 w-full">
            <div className="flex flex-col lg:flex-row gap-3 items-end lg:flex-1">
              <select 
                value={player1Id} 
                onChange={(e) => setPlayer1Id(e.target.value)}
                className={`w-full lg:flex-1 px-3 py-2 body-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#171717] focus:border-[#171717] transition-colors ${
                  !player1Id ? 'text-gray-500' : 'text-[#171717]'
                }`}
              >
                <option value="" disabled className="text-gray-500">
                  Select Player 1
                </option>
                {players
                  .filter(p => p.id !== player2Id) // Filter out player 2
                  .map((p) => (
                    <option key={p.id} value={p.id} className="text-[#171717]">
                      {p.name} (ELO: {p.elo_rating})
                    </option>
                  ))}
              </select>
              <input
                type="text"
                placeholder="0"
                value={player1Score || ''}
                onChange={(e) => setPlayer1Score(Number(e.target.value) || 0)}
                className="w-20 px-3 py-2 body-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#171717] focus:border-[#171717] transition-colors text-center"
              />
            </div>

            <div className="flex flex-col lg:flex-row gap-3 items-end lg:flex-1">
              <input
                type="text"
                placeholder="0"
                value={player2Score || ''}
                onChange={(e) => setPlayer2Score(Number(e.target.value) || 0)}
                className="w-20 px-3 py-2 body-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#171717] focus:border-[#171717] transition-colors text-center"
              />
              <select 
                value={player2Id} 
                onChange={(e) => setPlayer2Id(e.target.value)}
                className={`w-full lg:flex-1 px-3 py-2 body-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#171717] focus:border-[#171717] transition-colors ${
                  !player2Id ? 'text-gray-500' : 'text-[#171717]'
                }`}
              >
                <option value="" disabled className="text-gray-500">
                  Select Player 2
                </option>
                {players
                  .filter(p => p.id !== player1Id) // Filter out player 1
                  .map((p) => (
                    <option key={p.id} value={p.id} className="text-[#171717]">
                      {p.name} (ELO: {p.elo_rating})
                    </option>
                  ))}
              </select>
            </div>
          </div>
          
          {/* Validation Error Display */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 sm:p-4">
              <p className="body-medium text-red-800">{errorMsg}</p>
            </div>
          )}
          
          <DialogActions
            onCancel={handleClose}
            onConfirm={() => {}}
            confirmText="Add Match"
            confirmDisabled={!canSubmitMatch()}
          />
        </form>
      </div>
    </div>
  )
}

