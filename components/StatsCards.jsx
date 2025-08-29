'use client'

import React from 'react'
import Chip from './Chip'

export default function StatsCards({ players, matches }) {

  // Calculate Total Matches with week-over-week trend
  const getTotalMatches = () => {
    const totalMatches = matches.length
    
    // Calculate matches from last week (7 days ago)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const matchesLastWeek = matches.filter(match => {
      const matchDate = new Date(match.played_at || match.created_at)
      return matchDate >= oneWeekAgo
    }).length
    
    // Calculate matches from previous week (8-14 days ago)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    
    const matchesPreviousWeek = matches.filter(match => {
      const matchDate = new Date(match.played_at || match.created_at)
      return matchDate >= twoWeeksAgo && matchDate < oneWeekAgo
    }).length
    
    // Calculate trend percentage
    let trendPercentage = 0
    if (matchesPreviousWeek > 0) {
      trendPercentage = Math.round(((matchesLastWeek - matchesPreviousWeek) / matchesPreviousWeek) * 100)
    } else if (matchesLastWeek > 0) {
      trendPercentage = 100 // If no matches previous week but matches this week, show 100% increase
    }
    
    return { total: totalMatches, lastWeek: matchesLastWeek, trend: trendPercentage }
  }

  // Calculate Win Rate Leader
  const getWinRateLeader = () => {
    if (players.length === 0) return null
    
    const playerWithBestWinRate = players.reduce((best, current) => {
      if (current.matches_played === 0) return best
      
      const currentWinRate = current.matches_won / current.matches_played
      const bestWinRate = best ? best.matches_won / best.matches_played : 0
      
      return currentWinRate > bestWinRate ? current : best
    }, null)
    
    if (!playerWithBestWinRate || playerWithBestWinRate.matches_played === 0) return null
    
    const winRate = Math.round((playerWithBestWinRate.matches_won / playerWithBestWinRate.matches_played) * 100)
    
    return { player: playerWithBestWinRate, winRate }
  }

  // Calculate Winning Streak (player with longest current winning streak)
  const getWinningStreak = () => {
    if (matches.length === 0) return null
    
    // Sort matches by date (newest first)
    const sortedMatches = [...matches].sort((a, b) => 
      new Date(b.played_at || b.created_at) - new Date(a.played_at || a.created_at)
    )
    
    const playerStreaks = {}
    
    // Calculate current winning streaks for each player
    players.forEach(player => {
      let currentStreak = 0
      let isOnStreak = true
      
      for (const match of sortedMatches) {
        if (match.player1_id === player.id) {
          if (match.winner_id === player.id && isOnStreak) {
            currentStreak++
          } else {
            break
          }
        } else if (match.player2_id === player.id) {
          if (match.winner_id === player.id && isOnStreak) {
            currentStreak++
          } else {
            break
          }
        }
      }
      
      if (currentStreak > 0) {
        playerStreaks[player.id] = currentStreak
      }
    })
    
    // Find player with longest streak
    const longestStreakId = Object.keys(playerStreaks).reduce((a, b) => 
      playerStreaks[a] > playerStreaks[b] ? a : b, null
    )
    
    if (!longestStreakId) return null
    
    const player = players.find(p => p.id === longestStreakId)
    const streak = playerStreaks[longestStreakId]
    
    return { player, streak }
  }

  // Calculate Biggest ELO Change (match with largest ELO swing)
  const getBiggestEloChange = () => {
    if (matches.length === 0) return null
    
    const biggestEloChange = matches.reduce((biggest, match) => {
      const matchEloChange = Math.abs(match.player1_elo_change) + Math.abs(match.player2_elo_change)
      const currentBiggest = Math.abs(biggest.player1_elo_change) + Math.abs(biggest.player2_elo_change)
      return matchEloChange > currentBiggest ? match : biggest
    })
    
    const player1 = players.find(p => p.id === biggestEloChange.player1_id)
    const player2 = players.find(p => p.id === biggestEloChange.player2_id)
    const totalEloChange = Math.abs(biggestEloChange.player1_elo_change) + Math.abs(biggestEloChange.player2_elo_change)
    
    return { 
      match: biggestEloChange, 
      player1, 
      player2, 
      totalEloChange,
      player1Change: biggestEloChange.player1_elo_change,
      player2Change: biggestEloChange.player2_elo_change
    }
  }

  const totalMatches = getTotalMatches()
  const winRateLeader = getWinRateLeader()
  const winningStreak = getWinningStreak()
  const biggestEloChange = getBiggestEloChange()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">


      {/* Total Matches */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Total Matches</span>
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🏓</span>
          </div>
        </div>
        <div className="text-3xl font-medium text-gray-900 mb-1">
          {totalMatches.total || '-'}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {totalMatches.lastWeek || '-'} this week
          </span>
          {totalMatches.trend !== 0 && (
            <Chip 
              variant={totalMatches.trend > 0 ? 'success' : 'danger'}
              size="sm"
            >
              {totalMatches.trend > 0 ? '+' : ''}{totalMatches.trend}%
            </Chip>
          )}
        </div>
      </div>

      {/* Win Rate Leader */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Win Rate Leader</span>
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🏆</span>
          </div>
        </div>
        {winRateLeader ? (
          <>
            <div className="text-3xl font-medium text-gray-900 mb-1">
              {winRateLeader.winRate}%
            </div>
            <div className="text-sm font-medium text-gray-700">
              {winRateLeader.player.name}
            </div>
          </>
        ) : (
          <>
            <div className="text-3xl font-medium text-gray-900 mb-1">-</div>
            <div className="text-sm font-medium text-gray-700">-</div>
          </>
        )}
      </div>

      {/* Winning Streak */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Winning Streak</span>
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🔥</span>
          </div>
        </div>
        {winningStreak ? (
          <>
            <div className="text-3xl font-medium text-gray-900 mb-1">
              {winningStreak.streak}
            </div>
            <div className="text-sm font-medium text-gray-700">
              {winningStreak.player.name}
            </div>
          </>
        ) : (
          <>
            <div className="text-3xl font-medium text-gray-900 mb-1">-</div>
            <div className="text-sm font-medium text-gray-700">-</div>
          </>
        )}
      </div>

      {/* Biggest ELO Change */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Biggest ELO Swing</span>
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">⚡</span>
          </div>
        </div>
        {biggestEloChange ? (
          <>
            <div className="text-3xl font-medium text-gray-900 mb-1">
              {biggestEloChange.player1Change > 0 ? '+' : ''}{biggestEloChange.player1Change}
            </div>
            <div className="text-sm font-medium text-gray-700">
              {biggestEloChange.player1?.name || 'Unknown'} vs {biggestEloChange.player2?.name || 'Unknown'}
            </div>
          </>
        ) : (
          <>
            <div className="text-3xl font-medium text-gray-900 mb-1">-</div>
            <div className="text-sm font-medium text-gray-700">-</div>
          </>
        )}
      </div>
    </div>
  )
}
