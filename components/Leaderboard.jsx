'use client'

import React, { useState, useEffect } from 'react'
import Confetti from './Confetti'
import { LoadingSpinner } from './SkeletonLoaders'
import { useData } from '../lib/DataContext'
import Button from './Button'
import DialogActions from './DialogActions'
import StatsCards from './StatsCards'
import Table, { TableContainer, TableHead, TableBody, TableHeader, TableRow, TableCell } from './Table'
import { ToastContainer } from './Toast'




// Award icon mapping
const AWARD_ICONS = {
  mostPoints: '⚡',
  highestElo: '👑',
  winningStreak: '🔥',
  giantKiller: '🗡️',
  socialButterfly: '🦋',
  bestDefense: '🛡️',
  highestMatch: '💥',
  eloSwing: '📈',
  biggestLoser: '💀',
}

const AWARD_NAMES = {
  mostPoints: 'Most Points',
  highestElo: 'Highest ELO',
  winningStreak: 'Winning Streak',
  giantKiller: 'Giant Killer',
  socialButterfly: 'Social Butterfly',
  bestDefense: 'Best Defense',
  highestMatch: 'Highest Match',
  eloSwing: 'ELO Swing',
  biggestLoser: 'Biggest Loser',
}

export default function Leaderboard() {
  const { players, matches, monthlyAwards, isLoading, hasLoadedOnce, addPlayer: addPlayerToContext, addMatch: addMatchToContext } = useData()

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
  
  // Group awards by player
  const playerAwards = {}
  monthlyAwards.forEach(award => {
    if (!playerAwards[award.player_id]) {
      playerAwards[award.player_id] = []
    }
    playerAwards[award.player_id].push(award)
  })

  // Dialog state for adding players
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false)
  const [dialogAnimation, setDialogAnimation] = useState(false)

  // Dialog state for adding matches
  const [showAddMatchDialog, setShowAddMatchDialog] = useState(false)
  const [matchDialogAnimation, setMatchDialogAnimation] = useState(false)
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false)
  
  // Dialog state for scoring matches
  const [showScoreDialog, setShowScoreDialog] = useState(false)
  const [scoreDialogAnimation, setScoreDialogAnimation] = useState(false)
  
  // Dialog state for André prank
  const [showAndrePrankDialog, setShowAndrePrankDialog] = useState(false)
  const [andrePrankAnimation, setAndrePrankAnimation] = useState(false)

  // Function to close player dialog with animation
  const closePlayerDialog = () => {
    setDialogAnimation(false)
    setTimeout(() => setShowAddPlayerDialog(false), 200)
  }

  // Function to close match dialog with animation
  const closeMatchDialog = () => {
    setMatchDialogAnimation(false)
    setTimeout(() => setShowAddMatchDialog(false), 200)
    // Reset form state when closing
    setPlayer1Id('')
    setPlayer2Id('')
    setPlayer1Score(0)
    setPlayer2Score(0)
    setErrorMsg('')
  }

  // Handle ESC key to close dialogs
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showAddPlayerDialog) {
          closePlayerDialog()
        } else if (showAddMatchDialog) {
          closeMatchDialog()
        }
      }
    }

    if (showAddPlayerDialog || showAddMatchDialog) {
      document.addEventListener('keydown', handleEscKey)
      // Trigger animation after a brief delay
      if (showAddPlayerDialog) {
        setTimeout(() => setDialogAnimation(true), 10)
      }
      if (showAddMatchDialog) {
        setTimeout(() => setMatchDialogAnimation(true), 10)
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showAddPlayerDialog, showAddMatchDialog])



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
    
    // Debug: Log the current state
    console.log('Submitting match with data:', {
      player1Id,
      player2Id,
      player1Score,
      player2Score,
      players: players.map(p => ({ id: p.id, name: p.name }))
    })
    
    // Validate that players are selected
    if (!player1Id || !player2Id || player1Id === '' || player2Id === '') {
      setErrorMsg('Please select both players')
      return
    }
    
    // Check if at least one player scored 11+ points to win (ping pong rule)
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

    // Debug: Log the match data being sent
    const matchData = {
      player1_id: player1Id,
      player2_id: player2Id,
      player1_score: player1Score,
      player2_score: player2Score,
      winner_id: winnerId,
      player1_elo_change: player1EloChange,
      player2_elo_change: player2EloChange,
      played_at: new Date().toISOString(),
    }
    
    console.log('Sending match data to API:', matchData)

    try {
      await addMatchToContext(matchData)

      setPlayer1Score(0)
      setPlayer2Score(0)
      setPlayer1Id('') // Reset player selections
      setPlayer2Id('')
      
      // Close the dialog
      closeMatchDialog()
      
      // Show confetti after dialog is closed
      setTimeout(() => {
        const winner = players.find(p => p.id === winnerId)
        // Trigger confetti from bottom center of screen
        const x = window.innerWidth / 2
        const y = window.innerHeight // Start from very bottom of screen
        triggerConfetti(x, y)
      }, 250) // Wait for dialog close animation to complete
    } catch (err) {
      setErrorMsg(err.message)
      addToast(`Failed to add match: ${err.message}`, 'error')
    }
  }

  return (
    <div className="pt-8 pb-6 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-left">
          <h1 className="mb-3 text-[#171717]">Rankings</h1>
        </div>

        {/* Stats Cards */}
        <StatsCards players={players} matches={matches} />



        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[#171717]">Player Rankings</h2>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowAddMatchDialog(true)
                  setMatchDialogAnimation(false)
                }}
                variant="primary"
                size="lg"
                className="rounded-full"
              >
                Add Match
              </Button>
              <Button
                onClick={() => {
                  setShowAddPlayerDialog(true)
                  setDialogAnimation(false)
                }}
                variant="secondary"
                size="lg"
                className="rounded-full"
              >
                Add Player
              </Button>
            </div>
          </div>
          {isLoading && !hasLoadedOnce ? (
            <LoadingSpinner />
          ) : (
                          <TableContainer>
              <Table>
                <TableHead>
                  <TableRow isHeader>
                    <TableHeader width="sm">Rank</TableHeader>
                    <TableHeader width="xxl">Player</TableHeader>
                    <TableHeader width="md">ELO</TableHeader>
                    <TableHeader width="md">Played</TableHeader>
                    <TableHeader width="md">Won</TableHeader>
                    <TableHeader width="md">Lost</TableHeader>
                    <TableHeader width="xl">Awards</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {players
                    .slice()
                    .sort((a, b) => b.elo_rating - a.elo_rating)
                    .map((p, index) => {
                      const awards = playerAwards[p.id] || []
                      return (
                        <TableRow key={p.id} isSpecial={index === 0}>
                          <TableCell>
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-900">
                              {index + 1}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {index === 0 && <span className="text-yellow-600">🥇</span>}
                              {index === 1 && <span className="text-gray-400">🥈</span>}
                              {index === 2 && <span className="text-amber-600">🥉</span>}
                              <span className="font-medium text-gray-900">
                                {p.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{p.elo_rating}</TableCell>
                          <TableCell text="muted">{p.matches_played}</TableCell>
                          <TableCell text="success">{p.matches_won}</TableCell>
                          <TableCell text="danger">{p.matches_lost}</TableCell>
                          <TableCell>
                            {awards.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {awards.map((award, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center text-lg"
                                    title={AWARD_NAMES[award.category] || award.category}
                                  >
                                    {AWARD_ICONS[award.category] || '🏆'}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No awards yet</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </TableContainer>
            )}
        </div>
      </div>
      
      {/* Add Player Dialog */}
      {showAddPlayerDialog && (
        <div 
          className={`fixed inset-0 bg-black transition-all duration-200 ease-out ${
            dialogAnimation ? 'bg-opacity-30' : 'bg-opacity-0'
          } flex items-center justify-center z-50 p-4`}
          onClick={(e) => e.target === e.currentTarget && closePlayerDialog()}
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
                onClick={closePlayerDialog}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#171717] focus:border-[#171717] transition-colors"
              />
              <DialogActions
                onCancel={closePlayerDialog}
                onConfirm={() => {}}
                confirmText="Add Player"
                confirmDisabled={!newPlayerName.trim()}
              />
            </form>
          </div>
        </div>
      )}

      {/* Add Match Dialog */}
      {showAddMatchDialog && (
        <div 
          className={`fixed inset-0 bg-black transition-all duration-200 ease-out ${
            matchDialogAnimation ? 'bg-opacity-30' : 'bg-opacity-0'
          } flex items-center justify-center z-50 p-4`}
          onClick={(e) => e.target === e.currentTarget && closeMatchDialog()}
        >
          <div 
            className={`bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 transform transition-all duration-200 ease-out ${
              matchDialogAnimation 
                ? 'scale-100 opacity-100 translate-y-0' 
                : 'scale-95 opacity-0 translate-y-4'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Match</h3>
              <button
                onClick={closeMatchDialog}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddMatch} className="space-y-4">
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
                onCancel={closeMatchDialog}
                onConfirm={() => {}}
                confirmText="Add Match"
                confirmDisabled={!canSubmitMatch()}
              />
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={(id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
      }} />

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
