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

  // Fetch players and matches on mount
  useEffect(() => {
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

      // Ensure newest matches show first in UI
      data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      
      console.log('Processed matches data:', data)
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
    } catch (err) {
      setErrorMsg(err.message)
    }
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
    if (!player1Id || !player2Id || player1Id === player2Id) {
      setErrorMsg('Select two different players')
      return
    }
    if (player1Score < 0 || player2Score < 0) {
      setErrorMsg('Scores cannot be negative')
      return
    }
    setErrorMsg('')

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
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: 'auto', padding: 20 }}>
      <h1>Ping Pong Leaderboard</h1>

      <form onSubmit={addPlayer} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="New player name"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          required
        />
        <button type="submit">Add Player</button>
      </form>

      <form onSubmit={addMatch} style={{ marginBottom: 20 }}>
        <div>
          <label>
            Player 1:
            <select value={player1Id} onChange={(e) => setPlayer1Id(e.target.value)}>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (ELO: {p.elo_rating})
                </option>
              ))}
            </select>
          </label>
          <input
            type="number"
            min="0"
            value={player1Score}
            onChange={(e) => setPlayer1Score(Number(e.target.value))}
          />
        </div>

        <div>
          <label>
            Player 2:
            <select value={player2Id} onChange={(e) => setPlayer2Id(e.target.value)}>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (ELO: {p.elo_rating})
                </option>
              ))}
            </select>
          </label>
          <input
            type="number"
            min="0"
            value={player2Score}
            onChange={(e) => setPlayer2Score(Number(e.target.value))}
          />
        </div>

        <button type="submit">Add Match</button>
      </form>

      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

      <h2>Leaderboard</h2>
      <table border="1" cellPadding="8" style={{ width: '100%', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>Player</th>
            <th>ELO</th>
            <th>Played</th>
            <th>Won</th>
            <th>Lost</th>
          </tr>
        </thead>
        <tbody>
          {players
            .slice()
            .sort((a, b) => b.elo_rating - a.elo_rating)
            .map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.elo_rating}</td>
                <td>{p.matches_played}</td>
                <td>{p.matches_won}</td>
                <td>{p.matches_lost}</td>
              </tr>
            ))}
        </tbody>
      </table>

      <h2>Recent Matches</h2>
      <table border="1" cellPadding="8" style={{ width: '100%', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>Player 1</th>
            <th>Score</th>
            <th>Player 2</th>
            <th>Score</th>
            <th>Winner</th>
            <th>ELO Change</th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(matches) ? matches : []).map((m) => {
            const player1 = players.find((p) => p.id === m.player1_id)
            const player2 = players.find((p) => p.id === m.player2_id)
            const winner = players.find((p) => p.id === m.winner_id)
            return (
              <tr key={m.id}>
                <td>{player1 ? player1.name : 'Unknown'}</td>
                <td>{m.player1_score}</td>
                <td>{player2 ? player2.name : 'Unknown'}</td>
                <td>{m.player2_score}</td>
                <td>{winner ? winner.name : 'Draw'}</td>
                <td>
                  {m.player1_elo_change > 0 && '+'}
                  {m.player1_elo_change} / {m.player2_elo_change > 0 && '+'}
                  {m.player2_elo_change}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
