'use client'

import React from 'react'
import Chip from './Chip'

export default function StatsCards({ players, matches }) {
  // Calculate Most Improved (player with biggest ELO gain in current week vs previous week)
  const getMostImproved = () => {
    if (matches.length === 0) return null
    
    // Calculate current week (last 7 days)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    // Calculate previous week (8-14 days ago)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    
    const currentWeekMatches = matches.filter(match => {
      const matchDate = new Date(match.played_at || match.created_at)
      return matchDate >= oneWeekAgo
    })
    
    const previousWeekMatches = matches.filter(match => {
      const matchDate = new Date(match.played_at || match.created_at)
      return matchDate >= twoWeeksAgo && matchDate < oneWeekAgo
    })
    
    // Calculate improvements for current week
    const currentWeekImprovements = {}
    currentWeekMatches.forEach(match => {
      if (match.player1_elo_change > 0) {
        currentWeekImprovements[match.player1_id] = (currentWeekImprovements[match.player1_id] || 0) + match.player1_elo_change
      }
      if (match.player2_elo_change > 0) {
        currentWeekImprovements[match.player2_id] = (currentWeekImprovements[match.player2_id] || 0) + match.player2_elo_change
      }
    })
    
    // Calculate improvements for previous week
    const previousWeekImprovements = {}
    previousWeekMatches.forEach(match => {
      if (match.player1_elo_change > 0) {
        previousWeekImprovements[match.player1_id] = (previousWeekImprovements[match.player1_id] || 0) + match.player1_elo_change
      }
      if (match.player2_elo_change > 0) {
        previousWeekImprovements[match.player2_id] = (previousWeekImprovements[match.player2_id] || 0) + match.player2_elo_change
      }
    })
    
    // Find player with most improvements in current week
    const mostImprovedId = Object.keys(currentWeekImprovements).reduce((a, b) => 
      currentWeekImprovements[a] > currentWeekImprovements[b] ? a : b, null
    )
    
    if (!mostImprovedId) return null
    
    const player = players.find(p => p.id === mostImprovedId)
    const currentWeekImprovement = currentWeekImprovements[mostImprovedId]
    const previousWeekImprovement = previousWeekImprovements[mostImprovedId] || 0
    
    // Calculate percentage change
    let percentageChange = 0
    if (previousWeekImprovement > 0) {
      percentageChange = Math.round(((currentWeekImprovement - previousWeekImprovement) / previousWeekImprovement) * 100)
    } else if (currentWeekImprovement > 0) {
      percentageChange = 100 // If no improvement previous week but improvement this week, show 100% increase
    }
    
    return { 
      player, 
      improvement: currentWeekImprovement, 
      percentageChange 
    }
  }

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

  const mostImproved = getMostImproved()
  const totalMatches = getTotalMatches()
  const winRateLeader = getWinRateLeader()
  const winningStreak = getWinningStreak()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Most Improved */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Most points scored</span>
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">📈</span>
          </div>
        </div>
        {mostImproved ? (
          <>
            <div className="text-3xl font-medium text-gray-900 mb-1">
              +{mostImproved.improvement}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {mostImproved.player.name} this week
              </span>
              {mostImproved.percentageChange !== 0 && (
                <Chip 
                  variant={mostImproved.percentageChange > 0 ? 'success' : 'danger'}
                  size="sm"
                >
                  {mostImproved.percentageChange > 0 ? '+' : ''}{mostImproved.percentageChange}%
                </Chip>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-3xl font-medium text-gray-900 mb-1">-</div>
            <div className="text-sm font-medium text-gray-700">-</div>
          </>
        )}
      </div>

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
    </div>
  )
}
