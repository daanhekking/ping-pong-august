'use client'

import React, { useEffect, useState } from 'react'

export default function Scoreboard() {
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])

  // Form states
  const [newPlayerName, setNewPlayerName] = useState('')
  const [player1Id, setPlayer1Id] = useState('')
  const [player2Id, setPlayer2Id] = useState('')
  const [player1Score, setPlayer1Score] = useState(0)
  const [player2Score, setPlayer2Score] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  // Toast notification state
  const [toasts, setToasts] = useState([])

  // Fetch players and matches on mount
  useEffect(() => {
    console.log('Component mounted, fetching data...')
    fetchPlayers()
    fetchMatches()
  }, [])

  async function fetchPlayers() {
    try {
      const res = await fetch('/api/players')
      if (!res.ok) throw new Error('Failed to fetch players')
      const data = await res.json()
      console.log('Players data:', data)
      if (!Array.isArray(data)) throw new Error('Players data is not an array')
      setPlayers(data)
      // Set default player selections if none yet
      if (data.length > 0 && !player1Id) setPlayer1Id(data[0].id)
      if (data.length > 1 && !player2Id) setPlayer2Id(data[1].id)
    } catch (err) {
      console.error('Failed to fetch players:', err)
      setPlayers([])
    }
  }

  async function fetchMatches() {
    try {
      const res = await fetch('/api/matches')
      if (!res.ok) throw new Error('Failed to fetch matches')
      let data = await res.json()

      console.log('Raw matches data:', data)

      if (!Array.isArray(data)) {
        console.error('Matches data is not an array:', typeof data, data)
        setMatches([])
        return
      }

      // Ensure newest matches show first in UI (prefer played_at, fallback created_at)
      data.sort((a, b) => new Date(b.played_at || b.created_at) - new Date(a.played_at || a.created_at))
      
      console.log('Processed matches data:', data)
      console.log('Setting matches state to:', data)
      setMatches(data)
    } catch (err) {
      console.error('Failed to fetch matches:', err)
      setMatches([])
    }
  }

  // Add a new player
  async function addPlayer(e) {
    e.preventDefault()
    if (!newPlayerName.trim()) {
      setErrorMsg('Player name cannot be empty')
      return
    }
    setErrorMsg('')
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName.trim() }),
      })
      if (!res.ok) throw new Error('Failed to add player')
      const addedPlayer = await res.json()
      setPlayers((prev) => [...prev, addedPlayer])
      setNewPlayerName('')
      if (!player1Id) setPlayer1Id(addedPlayer.id)
      else if (!player2Id) setPlayer2Id(addedPlayer.id)
      
      // Show success toast
      addToast(`Player "${addedPlayer.name}" added successfully!`, 'success')
    } catch (err) {
      setErrorMsg(err.message)
      addToast(`Failed to add player: ${err.message}`, 'error')
    }
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
  async function addMatch(e) {
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
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1_id: player1Id,
          player2_id: player2Id,
          player1_score: player1Score,
          player2_score: player2Score,
          winner_id: winnerId,
          player1_elo_change: player1EloChange,
          player2_elo_change: player2EloChange,
          played_at: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error('Failed to add match')
      const newMatch = await res.json()
      setMatches((prev) => [newMatch, ...prev])

      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === player1Id) {
            return {
              ...p,
              elo_rating: p.elo_rating + player1EloChange,
              matches_played: p.matches_played + 1,
              matches_won: p.id === winnerId ? p.matches_won + 1 : p.matches_won,
              matches_lost: p.id !== winnerId ? p.matches_lost + 1 : p.matches_lost,
            }
          }
          if (p.id === player2Id) {
            return {
              ...p,
              elo_rating: p.elo_rating + player2EloChange,
              matches_played: p.matches_played + 1,
              matches_won: p.id === winnerId ? p.matches_won + 1 : p.matches_won,
              matches_lost: p.id !== winnerId ? p.matches_lost + 1 : p.matches_lost,
            }
          }
          return p
        })
      )

      setPlayer1Score(0)
      setPlayer2Score(0)
      
      // Show success toast
      const winner = players.find(p => p.id === winnerId)
      addToast(`Match recorded! ${winner ? winner.name : 'Unknown'} won!`, 'success')
    } catch (err) {
      setErrorMsg(err.message)
      addToast(`Failed to record match: ${err.message}`, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Ping Pong Leaderboard</h1>
          <p className="text-lg text-gray-600">Track your matches and climb the rankings</p>
        </div>

        {/* Add Player Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Player</h2>
          <form onSubmit={addPlayer} className="flex gap-3">
            <input
              type="text"
              placeholder="Enter player name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              required
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <button 
              type="submit"
              disabled={!newPlayerName.trim()}
              className={`px-6 py-3 font-medium rounded-lg focus:ring-2 focus:ring-offset-2 transition-colors ${
                newPlayerName.trim() 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Add Player
            </button>
          </form>
        </div>

        {/* Add Match Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Record New Match</h2>
          <form onSubmit={addMatch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Player 1
                </label>
                <select 
                  value={player1Id} 
                  onChange={(e) => setPlayer1Id(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Player 2
                </label>
                <select 
                  value={player2Id} 
                  onChange={(e) => setPlayer2Id(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            
            {/* Validation Error Display */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{errorMsg}</p>
              </div>
            )}
            
            <button 
              type="submit"
              disabled={!canSubmitMatch()}
              className={`w-full px-6 py-3 font-medium rounded-lg focus:ring-2 focus:ring-offset-2 transition-colors ${
                canSubmitMatch() 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Record Match
            </button>
          </form>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Leaderboard</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Player</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">ELO</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Played</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Won</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Lost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {players
                  .slice()
                  .sort((a, b) => b.elo_rating - a.elo_rating)
                  .map((p, index) => (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${index === 0 ? 'bg-yellow-50' : ''}`}>
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
        </div>

        {/* Recent Matches */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Matches</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Player 1</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Score</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Player 2</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Score</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Winner</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Played</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">ELO Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(Array.isArray(matches) ? matches : []).map((m) => {
                  const player1 = players.find((p) => p.id === m.player1_id)
                  const player2 = players.find((p) => p.id === m.player2_id)
                  const winner = players.find((p) => p.id === m.winner_id)
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{player1 ? player1.name : 'Unknown'}</td>
                      <td className="py-3 px-4 font-mono text-gray-700">{m.player1_score}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{player2 ? player2.name : 'Unknown'}</td>
                      <td className="py-3 px-4 font-mono text-gray-700">{m.player2_score}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          winner ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {winner ? winner.name : 'Draw'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {(m.played_at || m.created_at) 
                          ? new Date(m.played_at || m.created_at).toLocaleString('nb-NO', { 
                              timeZone: 'Europe/Oslo', 
                              year: 'numeric', month: '2-digit', day: '2-digit', 
                              hour: '2-digit', minute: '2-digit' 
                            }) 
                          : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <span className={`font-mono ${m.player1_elo_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {m.player1_elo_change > 0 && '+'}{m.player1_elo_change}
                          </span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className={`font-mono ${m.player2_elo_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {m.player2_elo_change > 0 && '+'}{m.player2_elo_change}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
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
    </div>
  )
}
