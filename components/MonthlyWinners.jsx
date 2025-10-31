'use client'

import React, { useState, useEffect } from 'react'
import { LoadingSpinner } from './SkeletonLoaders'
import { useData } from '../lib/DataContext'
import Chip from './Chip'

// Tooltip component
function Tooltip({ children, text }) {
  const [isVisible, setIsVisible] = useState(false)
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-normal max-w-xs">
          <div className="text-center">{text}</div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}

export default function MonthlyWinners() {
  const { players, matches, isLoading, hasLoadedOnce, refreshData } = useData()
  
  // Default to August 2025 (month index 7 = August)
  const [selectedMonth, setSelectedMonth] = useState(7) // August
  const [selectedYear, setSelectedYear] = useState(2025)
  
  const displayDate = new Date(selectedYear, selectedMonth, 1)
  const currentMonth = displayDate.toLocaleString('en-US', { month: 'long' })
  const currentYear = selectedYear
  
  // Filter matches from selected calendar month
  const monthlyMatches = matches.filter(match => {
    const matchDate = new Date(match.played_at || match.created_at)
    return matchDate.getMonth() === selectedMonth && 
           matchDate.getFullYear() === selectedYear
  })
  
  // Get available months from matches data
  const getAvailableMonths = () => {
    const monthsSet = new Set()
    matches.forEach(match => {
      const matchDate = new Date(match.played_at || match.created_at)
      const monthKey = `${matchDate.getFullYear()}-${matchDate.getMonth()}`
      monthsSet.add(monthKey)
    })
    return Array.from(monthsSet).map(key => {
      const [year, month] = key.split('-')
      return { year: parseInt(year), month: parseInt(month) }
    }).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })
  }
  
  const availableMonths = getAvailableMonths()
  
  // Automatic award saving on the first day of a new month
  useEffect(() => {
    const checkAndSaveAwards = async () => {
      const now = new Date()
      const currentRealMonth = now.getMonth()
      const currentRealYear = now.getFullYear()
      
      // Get the last saved month from localStorage
      const lastSaved = localStorage.getItem('lastSavedMonth')
      const lastSavedData = lastSaved ? JSON.parse(lastSaved) : null
      
      // Check if we're in a new month and haven't saved awards yet
      const isNewMonth = !lastSavedData || 
        lastSavedData.month !== currentRealMonth || 
        lastSavedData.year !== currentRealYear
      
      // Only save if it's the 1st day of the month and we haven't saved yet
      if (isNewMonth && now.getDate() === 1 && monthlyMatches.length > 0) {
        // Calculate previous month
        const prevMonth = currentRealMonth === 0 ? 11 : currentRealMonth - 1
        const prevYear = currentRealMonth === 0 ? currentRealYear - 1 : currentRealYear
        
        // Get matches from previous month
        const prevMonthMatches = matches.filter(match => {
          const matchDate = new Date(match.played_at || match.created_at)
          return matchDate.getMonth() === prevMonth && matchDate.getFullYear() === prevYear
        })
        
        if (prevMonthMatches.length > 0) {
          await saveMonthAwards(prevMonth, prevYear, prevMonthMatches)
          
          // Mark that we've saved this month
          localStorage.setItem('lastSavedMonth', JSON.stringify({
            month: currentRealMonth,
            year: currentRealYear,
            savedAt: new Date().toISOString()
          }))
        }
      }
    }
    
    if (!isLoading && hasLoadedOnce && matches.length > 0) {
      checkAndSaveAwards()
    }
  }, [isLoading, hasLoadedOnce, matches])
  
  // Function to save awards for a specific month to the database
  const saveMonthAwards = async (month, year, matchesForMonth) => {
    // Calculate winners for the specific month
    const winners = calculateWinnersForMatches(matchesForMonth, month, year)
    if (!winners) return
    
    const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'long' })
    
    // Award categories to save (only winners)
    const awardCategories = [
      { key: 'mostPoints', winner: winners.mostPoints[0] },
      { key: 'highestElo', winner: winners.highestElo[0] },
      { key: 'winningStreak', winner: winners.winningStreak[0] },
      { key: 'giantKiller', winner: winners.giantKiller[0] },
      { key: 'socialButterfly', winner: winners.socialButterfly[0] },
      { key: 'bestDefense', winner: winners.leastPointsAgainst[0] },
      { key: 'highestMatch', winner: winners.mostPointsInMatch[0] },
      { key: 'eloSwing', winner: winners.biggestEloSwing[0] },
      { key: 'biggestLoser', winner: winners.biggestLoser[0] },
    ]
    
    // Build awards array for API
    const awardsToSave = []
    awardCategories.forEach(({ key, winner }) => {
      if (winner) {
        const playerId = winner.player?.id || winner.id
        awardsToSave.push({
          player_id: playerId,
          category: key,
          month: month,
          year: year,
          month_name: monthName,
        })
      }
    })
    
    // Save to database via API
    if (awardsToSave.length > 0) {
      try {
        const res = await fetch('/api/monthly-awards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ awards: awardsToSave }),
        })
        
        if (res.ok) {
          console.log(`Awards saved for ${monthName} ${year}`)
          refreshData() // Refresh to get new awards
        } else {
          console.error('Failed to save awards:', await res.text())
        }
      } catch (error) {
        console.error('Error saving awards:', error)
      }
    }
  }
  
  // Helper function to calculate winners for specific matches
  const calculateWinnersForMatches = (matchesForMonth, month, year) => {
    if (!matchesForMonth.length) return null
    
    const playerStats = {}
    
    // Initialize player stats
    players.forEach(player => {
      playerStats[player.id] = {
        player,
        totalPoints: 0,
        pointsAgainst: [],
        highestElo: player.elo_rating,
        maxPointsInMatch: 0,
        biggestEloSwing: 0,
        losses: 0,
        currentStreak: 0,
        longestStreak: 0,
        giantKillerWins: 0,
        uniqueOpponents: new Set(),
      }
    })
    
    const rivalries = {}
    
    // Sort matches by date for streak calculation
    const sortedMatches = [...matchesForMonth].sort((a, b) => 
      new Date(a.played_at || a.created_at) - new Date(b.played_at || b.created_at)
    )
    
    // Calculate stats from matches
    sortedMatches.forEach(match => {
      const p1Stats = playerStats[match.player1_id]
      const p2Stats = playerStats[match.player2_id]
      
      if (p1Stats && p2Stats) {
        const player1 = p1Stats.player
        const player2 = p2Stats.player
        
        p1Stats.totalPoints += match.player1_score
        p2Stats.totalPoints += match.player2_score
        
        p1Stats.pointsAgainst.push(match.player2_score)
        p2Stats.pointsAgainst.push(match.player1_score)
        
        p1Stats.maxPointsInMatch = Math.max(p1Stats.maxPointsInMatch, match.player1_score)
        p2Stats.maxPointsInMatch = Math.max(p2Stats.maxPointsInMatch, match.player2_score)
        
        p1Stats.biggestEloSwing = Math.max(p1Stats.biggestEloSwing, Math.abs(match.player1_elo_change))
        p2Stats.biggestEloSwing = Math.max(p2Stats.biggestEloSwing, Math.abs(match.player2_elo_change))
        
        if (match.winner_id === match.player2_id) {
          p1Stats.losses += 1
          p1Stats.currentStreak = 0
          p2Stats.currentStreak += 1
          p2Stats.longestStreak = Math.max(p2Stats.longestStreak, p2Stats.currentStreak)
        } else if (match.winner_id === match.player1_id) {
          p2Stats.losses += 1
          p2Stats.currentStreak = 0
          p1Stats.currentStreak += 1
          p1Stats.longestStreak = Math.max(p1Stats.longestStreak, p1Stats.currentStreak)
        }
        
        if (match.winner_id === match.player1_id && player1.elo_rating < player2.elo_rating) {
          p1Stats.giantKillerWins += 1
        } else if (match.winner_id === match.player2_id && player2.elo_rating < player1.elo_rating) {
          p2Stats.giantKillerWins += 1
        }
        
        p1Stats.uniqueOpponents.add(match.player2_id)
        p2Stats.uniqueOpponents.add(match.player1_id)
      }
    })
    
    const playersWithStats = Object.values(playerStats).filter(p => p.pointsAgainst.length > 0)
    
    playersWithStats.forEach(stats => {
      stats.avgPointsAgainst = stats.pointsAgainst.reduce((a, b) => a + b, 0) / stats.pointsAgainst.length
      stats.uniqueOpponentsCount = stats.uniqueOpponents.size
    })
    
    return {
      mostPoints: [...playersWithStats].sort((a, b) => b.totalPoints - a.totalPoints),
      highestElo: [...players].sort((a, b) => b.elo_rating - a.elo_rating),
      leastPointsAgainst: [...playersWithStats].sort((a, b) => a.avgPointsAgainst - b.avgPointsAgainst),
      mostPointsInMatch: [...playersWithStats].sort((a, b) => b.maxPointsInMatch - a.maxPointsInMatch),
      biggestEloSwing: [...playersWithStats].sort((a, b) => b.biggestEloSwing - a.biggestEloSwing),
      biggestLoser: [...playersWithStats].sort((a, b) => b.losses - a.losses),
      winningStreak: [...playersWithStats].sort((a, b) => b.longestStreak - a.longestStreak),
      giantKiller: [...playersWithStats].sort((a, b) => b.giantKillerWins - a.giantKillerWins),
      socialButterfly: [...playersWithStats].sort((a, b) => b.uniqueOpponentsCount - a.uniqueOpponentsCount),
    }
  }
  
  // Calculate monthly challenges
  const calculateMonthlyWinners = () => {
    if (!monthlyMatches.length) return null
    
    const playerStats = {}
    
    // Initialize player stats
    players.forEach(player => {
      playerStats[player.id] = {
        player,
        totalPoints: 0,
        pointsAgainst: [],
        highestElo: player.elo_rating,
        maxPointsInMatch: 0,
        biggestEloSwing: 0,
        losses: 0,
        currentStreak: 0,
        longestStreak: 0,
        giantKillerWins: 0,
        uniqueOpponents: new Set(),
        matchHistory: [], // For tracking streaks
      }
    })
    
    // Track rivalries (pairs of players)
    const rivalries = {}
    
    // Sort matches by date for streak calculation
    const sortedMatches = [...monthlyMatches].sort((a, b) => 
      new Date(a.played_at || a.created_at) - new Date(b.played_at || b.created_at)
    )
    
    // Calculate stats from monthly matches
    sortedMatches.forEach(match => {
      const p1Stats = playerStats[match.player1_id]
      const p2Stats = playerStats[match.player2_id]
      
      if (p1Stats && p2Stats) {
        const player1 = p1Stats.player
        const player2 = p2Stats.player
        
        // Total points scored
        p1Stats.totalPoints += match.player1_score
        p2Stats.totalPoints += match.player2_score
        
        // Points against
        p1Stats.pointsAgainst.push(match.player2_score)
        p2Stats.pointsAgainst.push(match.player1_score)
        
        // Max points in a single match
        p1Stats.maxPointsInMatch = Math.max(p1Stats.maxPointsInMatch, match.player1_score)
        p2Stats.maxPointsInMatch = Math.max(p2Stats.maxPointsInMatch, match.player2_score)
        
        // Biggest ELO swing
        p1Stats.biggestEloSwing = Math.max(p1Stats.biggestEloSwing, Math.abs(match.player1_elo_change))
        p2Stats.biggestEloSwing = Math.max(p2Stats.biggestEloSwing, Math.abs(match.player2_elo_change))
        
        // Track losses and winning streaks
        if (match.winner_id === match.player2_id) {
          // Player 2 won
          p1Stats.losses += 1
          p1Stats.currentStreak = 0
          p2Stats.currentStreak += 1
          p2Stats.longestStreak = Math.max(p2Stats.longestStreak, p2Stats.currentStreak)
        } else if (match.winner_id === match.player1_id) {
          // Player 1 won
          p2Stats.losses += 1
          p2Stats.currentStreak = 0
          p1Stats.currentStreak += 1
          p1Stats.longestStreak = Math.max(p1Stats.longestStreak, p1Stats.currentStreak)
        }
        
        // Giant Killer: Track wins against higher ELO opponents
        // Note: We use current ELO, which might not be accurate for historical matches
        // A better approach would be to store ELO before each match
        if (match.winner_id === match.player1_id && player1.elo_rating < player2.elo_rating) {
          p1Stats.giantKillerWins += 1
        } else if (match.winner_id === match.player2_id && player2.elo_rating < player1.elo_rating) {
          p2Stats.giantKillerWins += 1
        }
        
        // Social Butterfly: Track unique opponents
        p1Stats.uniqueOpponents.add(match.player2_id)
        p2Stats.uniqueOpponents.add(match.player1_id)
        
        // Rivalry Award: Track player pairs
        const pairKey = [match.player1_id, match.player2_id].sort().join('-')
        if (!rivalries[pairKey]) {
          rivalries[pairKey] = {
            player1: player1,
            player2: player2,
            player1Id: match.player1_id,
            player2Id: match.player2_id,
            matchCount: 0,
          }
        }
        rivalries[pairKey].matchCount += 1
      }
    })
    
    // Calculate averages and find winners
    const playersWithStats = Object.values(playerStats).filter(p => p.pointsAgainst.length > 0)
    
    playersWithStats.forEach(stats => {
      stats.avgPointsAgainst = stats.pointsAgainst.reduce((a, b) => a + b, 0) / stats.pointsAgainst.length
      stats.uniqueOpponentsCount = stats.uniqueOpponents.size
    })
    
    // Find winners for each challenge
    const mostPoints = [...playersWithStats].sort((a, b) => b.totalPoints - a.totalPoints)
    const highestElo = [...players].sort((a, b) => b.elo_rating - a.elo_rating)
    const leastPointsAgainst = [...playersWithStats].sort((a, b) => a.avgPointsAgainst - b.avgPointsAgainst)
    const mostPointsInMatch = [...playersWithStats].sort((a, b) => b.maxPointsInMatch - a.maxPointsInMatch)
    const biggestEloSwing = [...playersWithStats].sort((a, b) => b.biggestEloSwing - a.biggestEloSwing)
    const biggestLoser = [...playersWithStats].sort((a, b) => b.losses - a.losses)
    const winningStreak = [...playersWithStats].sort((a, b) => b.longestStreak - a.longestStreak)
    const giantKiller = [...playersWithStats].sort((a, b) => b.giantKillerWins - a.giantKillerWins)
    const socialButterfly = [...playersWithStats].sort((a, b) => b.uniqueOpponentsCount - a.uniqueOpponentsCount)
    
    // Find top rivalry
    const topRivalries = Object.values(rivalries)
      .sort((a, b) => b.matchCount - a.matchCount)
    
    return {
      mostPoints,
      highestElo,
      leastPointsAgainst,
      mostPointsInMatch,
      biggestEloSwing,
      biggestLoser,
      winningStreak,
      giantKiller,
      socialButterfly,
      topRivalries,
      stats: playerStats,
    }
  }
  
  const winners = calculateMonthlyWinners()
  
  return (
    <div className="pt-8 pb-6 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with month info and selector */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="text-left">
            <h1 className="mb-2 text-[#171717]">Monthly Winners</h1>
            <p className="text-gray-600 body-large">
              {currentMonth} {currentYear} • {monthlyMatches.length} matches played
            </p>
          </div>
          
          {/* Month Selector */}
          {availableMonths.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">View month:</span>
              <select
                value={`${selectedYear}-${selectedMonth}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-')
                  setSelectedYear(parseInt(year))
                  setSelectedMonth(parseInt(month))
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#171717] focus:border-[#171717] transition-colors bg-white text-gray-900 font-medium"
              >
                {availableMonths.map(({ year, month }) => {
                  const date = new Date(year, month, 1)
                  const monthName = date.toLocaleString('en-US', { month: 'long' })
                  return (
                    <option key={`${year}-${month}`} value={`${year}-${month}`}>
                      {monthName} {year}
                    </option>
                  )
                })}
              </select>
            </div>
          )}
        </div>
        
        {/* Stat Boards Layout */}
        {isLoading && !hasLoadedOnce ? (
          <LoadingSpinner />
        ) : !winners || monthlyMatches.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🏓</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No matches yet this month</h3>
            <p className="text-gray-600">Start playing to see this month's winners!</p>
          </div>
        ) : (
          <StatBoardsLayout winners={winners} monthlyMatches={monthlyMatches} />
        )}
      </div>
    </div>
  )
}

// Stat Boards Layout - Data-Dense Tables
function StatBoardsLayout({ winners, monthlyMatches }) {
  const [expandedCategories, setExpandedCategories] = useState({})
  
  const challenges = [
    {
      id: 'mostPoints',
      title: 'Most Points Scored',
      icon: '⚡',
      description: 'Player who scored the most total points across all matches this month',
      allPlayers: winners.mostPoints,
      getStatValue: (player) => player.totalPoints,
      statLabel: 'Total Points',
    },
    {
      id: 'highestElo',
      title: 'Highest ELO Score',
      icon: '👑',
      description: 'Player with the highest current ELO rating (skill level)',
      allPlayers: winners.highestElo,
      getStatValue: (player) => player.elo_rating,
      statLabel: 'ELO Rating',
    },
    {
      id: 'winningStreak',
      title: 'Winning Streak',
      icon: '🔥',
      description: 'Longest consecutive wins in a row this month - who\'s on fire?',
      allPlayers: winners.winningStreak,
      getStatValue: (player) => player.longestStreak,
      statLabel: 'Consecutive Wins',
    },
    {
      id: 'giantKiller',
      title: 'Giant Killer',
      icon: '🗡️',
      description: 'Most wins against higher-ranked opponents - underdog champion!',
      allPlayers: winners.giantKiller,
      getStatValue: (player) => player.giantKillerWins,
      statLabel: 'Upset Wins',
    },
    {
      id: 'socialButterfly',
      title: 'Social Butterfly',
      icon: '🦋',
      description: 'Played against the most different opponents - great for team building!',
      allPlayers: winners.socialButterfly,
      getStatValue: (player) => player.uniqueOpponentsCount,
      statLabel: 'Different Opponents',
    },
    {
      id: 'bestDefense',
      title: 'Best Defense',
      icon: '🛡️',
      description: 'Lowest average points conceded per match - defensive excellence',
      allPlayers: winners.leastPointsAgainst,
      getStatValue: (player) => player.avgPointsAgainst?.toFixed(1),
      statLabel: 'Avg Points Against',
    },
    {
      id: 'highestMatch',
      title: 'Highest Single Match Score',
      icon: '🔥',
      description: 'Most points scored in a single match - explosive performance!',
      allPlayers: winners.mostPointsInMatch,
      getStatValue: (player) => player.maxPointsInMatch,
      statLabel: 'Max Points',
    },
    {
      id: 'eloSwing',
      title: 'Biggest ELO Swing',
      icon: '📈',
      description: 'Largest ELO change in a single match - dramatic upset or domination',
      allPlayers: winners.biggestEloSwing,
      getStatValue: (player) => player.biggestEloSwing,
      statLabel: 'ELO Swing',
    },
    {
      id: 'biggestLoser',
      title: 'Biggest Loser',
      icon: '💀',
      description: 'Most losses this month - keep practicing, you\'ll get there!',
      allPlayers: winners.biggestLoser,
      getStatValue: (player) => player.losses,
      statLabel: 'Losses',
    },
  ]
  
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {challenges.map((challenge, idx) => {
          const isExpanded = expandedCategories[challenge.id]
          const playersToShow = isExpanded ? challenge.allPlayers : challenge.allPlayers.slice(0, 3)
          const hasMore = challenge.allPlayers.length > 3
          
          return (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{challenge.icon}</span>
                <Tooltip text={challenge.description}>
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-dotted border-gray-400">
                    {challenge.title}
                  </h3>
                </Tooltip>
              </div>
              
              <div className="space-y-2">
                {playersToShow.map((player, position) => (
                  <div
                    key={position}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      position === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        position === 0 ? 'bg-yellow-400 text-white' : 'bg-white text-gray-700 border border-gray-200'
                      }`}>
                        {position + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {player.player?.name || player.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${position === 0 ? 'text-yellow-700' : 'text-gray-900'}`}>
                        {challenge.getStatValue(player)}
                      </div>
                      <div className="text-xs text-gray-600">{challenge.statLabel}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {hasMore && (
                <button
                  onClick={() => toggleCategory(challenge.id)}
                  className="w-full mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  {isExpanded ? 'Show less' : `Show more (${challenge.allPlayers.length - 3} more)`}
                </button>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Rivalry Award - Special Card */}
      {winners.topRivalries && winners.topRivalries.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-sm border-2 border-red-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚔️</span>
            <Tooltip text="Two players who faced each other the most this month - fierce competition!">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-dotted border-gray-400">
                Rivalry Award
              </h3>
            </Tooltip>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-lg font-bold text-red-700">
                    {winners.topRivalries[0].player1.name[0]}
                  </div>
                  <div className="font-semibold text-gray-900">
                    {winners.topRivalries[0].player1.name}
                  </div>
                </div>
                
                <div className="text-xl font-bold text-red-600">VS</div>
                
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg font-bold text-orange-700">
                    {winners.topRivalries[0].player2.name[0]}
                  </div>
                  <div className="font-semibold text-gray-900">
                    {winners.topRivalries[0].player2.name}
                  </div>
                </div>
              </div>
              
              <div className="text-right ml-4">
                <div className="text-3xl font-bold text-gray-900">
                  {winners.topRivalries[0].matchCount}
                </div>
                <div className="text-xs text-gray-600">Matches</div>
              </div>
            </div>
            
            {winners.topRivalries.length > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-600 mb-2">Other Notable Rivalries:</div>
                <div className="space-y-2">
                  {winners.topRivalries.slice(1, 4).map((rivalry, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="text-gray-700">
                        {rivalry.player1.name} vs {rivalry.player2.name}
                      </div>
                      <div className="font-medium text-gray-900">
                        {rivalry.matchCount} matches
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
