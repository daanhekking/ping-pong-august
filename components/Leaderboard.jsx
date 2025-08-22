'use client'

import React, { useState, useEffect } from 'react'
import Confetti from './Confetti'
import { LoadingSpinner } from './SkeletonLoaders'
import { useData } from '../lib/DataContext'

export default function Leaderboard() {
  const { players, matches, isLoading, hasLoadedOnce, addPlayer: addPlayerToContext, addMatch: addMatchToContext } = useData()

  // Form states
  const [newPlayerName, setNewPlayerName] = useState('')
  const [player1Id, setPlayer1Id] = useState('')
  const [player2Id, setPlayer2Id] = useState('')
  const [player1Score, setPlayer1Score] = useState(0)
  const [player2Score, setPlayer2Score] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  // Confetti state
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiPosition, setConfettiPosition] = useState({ x: 0, y: 0 })
  
  // Toast notification state
  const [toasts, setToasts] = useState([])

  // Dialog state for adding players
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false)
  const [dialogAnimation, setDialogAnimation] = useState(false)

  // Function to close dialog with animation
  const closeDialog = () => {
    setDialogAnimation(false)
    setTimeout(() => setShowAddPlayerDialog(false), 200)
  }



  // Handle ESC key to close dialog
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showAddPlayerDialog) {
        closeDialog()
      }
    }

    if (showAddPlayerDialog) {
      document.addEventListener('keydown', handleEscKey)
      // Trigger animation after a brief delay
      setTimeout(() => setDialogAnimation(true), 10)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showAddPlayerDialog])



  // Add a new player
  async function handleAddPlayer(e) {
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
      const addedPlayer = await addPlayerToContext({ name: newPlayerName.trim() })
      setNewPlayerName('')
      
      // Show success toast
      addToast(`Player "${addedPlayer.name}" added successfully!`, 'success')
    } catch (err) {
      setErrorMsg(err.message)
      addToast(`Failed to add player: ${err.message}`, 'error')
    }
  }

  // Confetti functions
  function triggerConfetti(x, y) {
    setConfettiPosition({ x, y })
    setShowConfetti(true)
  }
  
  // Toast notification functions
  function addToast(message, type = 'success') {
    const id = Date.now()
    const newToast = { id, message, type }
    setToasts(prev => [...prev, newToast])
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 4000)
  }

  // Validation function for match submission
  function canSubmitMatch() {
    // Both players must be selected
    if (!player1Id || !player2Id) return false
    
    // Players cannot play against themselves
    if (player1Id === player2Id) return false
    
    // At least one player must score 11+ points to win
    if (player1Score < 11 && player2Score < 11) return false
    
    return true
  }

  // Calculate ELO change (basic example)
  function calculateEloChange(ratingA, ratingB, scoreA, scoreB) {
    const K = 32
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
    const actualA = scoreA > scoreB ? 1 : scoreA === scoreB ? 0.5 : 0
    const change = Math.round(K * (actualA - expectedA))
    return change
  }

  // Add a new match
  async function handleAddMatch(e) {
    e.preventDefault()
    
    // Clear previous error messages
    setErrorMsg('')
    
    // Check if at least one player scored 11+ points (ping pong rule)
    if (player1Score < 11 && player2Score < 11) {
      setErrorMsg('At least one player must score 11 or more points to win a match')
      return
    }

    const player1 = players.find((p) => p.id === player1Id)
    const player2 = players.find((p) => p.id === player2Id)

    if (!player1 || !player2) {
      setErrorMsg('Invalid players selected')
      return
    }

    const player1EloChange = calculateEloChange(player1.elo_rating, player2.elo_rating, player1Score, player2Score)
    const player2EloChange = -player1EloChange
    const winnerId = player1Score > player2Score ? player1Id : player2Id

    try {
      await addMatchToContext({
        player1_id: player1Id,
        player2_id: player2Id,
        player1_score: player1Score,
        player2_score: player2Score,
        winner_id: winnerId,
        player1_elo_change: player1EloChange,
        player2_elo_change: player2EloChange,
        played_at: new Date().toISOString(),
      })

      setPlayer1Score(0)
      setPlayer2Score(0)
      setPlayer1Id('') // Reset player selections
      setPlayer2Id('')
      
      // Show confetti
      const winner = players.find(p => p.id === winnerId)
      // Get the button position for confetti
      const button = document.querySelector('button[type="submit"]')
      if (button) {
        const rect = button.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        triggerConfetti(x, y)
      }
    } catch (err) {
      setErrorMsg(err.message)
      addToast(`Failed to add match: ${err.message}`, 'error')
    }
  }

  return (
    <div className="py-8 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Leaderboard</h1>
          <p className="text-lg text-gray-600">Track your matches and climb the rankings</p>
        </div>

        {/* Add Match Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Match</h2>
          {isLoading && !hasLoadedOnce ? (
            <LoadingSpinner />
          ) : (
            <form onSubmit={handleAddMatch} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <select 
                    value={player1Id} 
                    onChange={(e) => setPlayer1Id(e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      !player1Id ? 'text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    <option value="" disabled className="text-gray-500">
                      Select Player 1
                    </option>
                    {players
                      .filter(p => p.id !== player2Id) // Filter out player 2
                      .map((p) => (
                        <option key={p.id} value={p.id} className="text-gray-900">
                          {p.name} (ELO: {p.elo_rating})
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={player1Score || ''}
                    onChange={(e) => setPlayer1Score(Number(e.target.value) || 0)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <select 
                    value={player2Id} 
                    onChange={(e) => setPlayer2Id(e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      !player2Id ? 'text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    <option value="" disabled className="text-gray-500">
                      Select Player 2
                    </option>
                    {players
                      .filter(p => p.id !== player1Id) // Filter out player 1
                      .map((p) => (
                        <option key={p.id} value={p.id} className="text-gray-900">
                          {p.name} (ELO: {p.elo_rating})
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={player2Score || ''}
                    onChange={(e) => setPlayer2Score(Number(e.target.value) || 0)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              
              {/* Validation Error Display */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                  <p className="text-red-800 text-sm">{errorMsg}</p>
                </div>
              )}
              
              <button 
                type="submit"
                disabled={!canSubmitMatch()}
                className={`w-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium rounded-lg focus:ring-2 focus:ring-offset-2 transition-colors ${
                  canSubmitMatch() 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add Match
              </button>
            </form>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Player Rankings</h2>
            <button
              onClick={() => {
                setShowAddPlayerDialog(true)
                setDialogAnimation(false)
              }}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Add Player
            </button>
          </div>
          {isLoading && !hasLoadedOnce ? (
            <LoadingSpinner />
          ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                                      <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 w-16">Rank</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 w-48">Player</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 w-24">ELO</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 w-24">Played</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 w-20">Won</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 w-20">Lost</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {players
                      .slice()
                      .sort((a, b) => b.elo_rating - a.elo_rating)
                      .map((p, index) => (
                        <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${index === 0 ? 'bg-yellow-50' : ''}`}>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            #{index + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {index === 0 && <span className="text-yellow-600 text-lg">🥇</span>}
                              {index === 1 && <span className="text-gray-400 text-lg">🥈</span>}
                              {index === 2 && <span className="text-amber-600 text-lg">🥉</span>}
                              <span className={`font-medium ${index === 0 ? 'text-yellow-700' : 'text-gray-900'}`}>
                                {p.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-gray-900">{p.elo_rating}</td>
                          <td className="py-3 px-4 text-gray-600">{p.matches_played}</td>
                          <td className="py-3 px-4 text-green-600 font-medium">{p.matches_won}</td>
                          <td className="py-3 px-4 text-red-600 font-medium">{p.matches_lost}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>
      
      {/* Add Player Dialog */}
      {showAddPlayerDialog && (
        <div 
          className={`fixed inset-0 bg-black transition-all duration-200 ease-out ${
            dialogAnimation ? 'bg-opacity-30' : 'bg-opacity-0'
          } flex items-center justify-center z-50 p-4`}
          onClick={(e) => e.target === e.currentTarget && closeDialog()}
        >
          <div 
            className={`bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-200 ease-out ${
              dialogAnimation 
                ? 'scale-100 opacity-100 translate-y-0' 
                : 'scale-95 opacity-0 translate-y-4'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Player</h3>
              <button
                onClick={closeDialog}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <input
                type="text"
                placeholder="Enter player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newPlayerName.trim()}
                  className={`flex-1 px-4 py-2 font-medium rounded-lg focus:ring-2 focus:ring-offset-2 transition-colors ${
                    newPlayerName.trim() 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Add Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-6 py-3 rounded-lg shadow-lg text-white font-medium transform transition-all duration-300 ${
              toast.type === 'success' 
                ? 'bg-green-500' 
                : toast.type === 'error' 
                ? 'bg-red-500' 
                : 'bg-blue-500'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Confetti Component */}
      <Confetti 
        isActive={showConfetti}
        onComplete={() => setShowConfetti(false)}
        position={confettiPosition}
        colors={[
          '#AA21FF',    // confetti-primary
          '#E6BCFF',    // confetti-secondary
          '#C8E9C7',    // confetti-accent
          '#FDCC93',    // confetti-highlight
          '#60A5FA',    // confetti-blue
          '#34D399',    // confetti-green
          '#FBBF24',    // confetti-yellow
          '#F87171'     // confetti-red
        ]}
        particleCount={300}
      />
    </div>
  )
}
