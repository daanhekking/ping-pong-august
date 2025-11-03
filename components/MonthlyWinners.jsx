'use client'

import React, { useState, useEffect } from 'react'
import { LoadingSpinner } from './SkeletonLoaders'
import { useData } from '../lib/DataContext'
import Chip from './Chip'
import Button from './Button'
import AddPlayerDialog from './AddPlayerDialog'
import AddMatchDialog from './AddMatchDialog'
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell, TableContainer } from './Table'

// Tooltip component
function Tooltip({ children, text }) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = React.useRef(null)
  
  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.top - 10,
        left: rect.left + rect.width / 2
      })
    }
    setIsVisible(true)
  }
  
  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div 
          className="fixed z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg max-w-[640px] w-max"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="text-center">{text}</div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}

export default function MonthlyWinners() {
  const { players, matches, isLoading, hasLoadedOnce, refreshData, addPlayer, addMatch } = useData()
  
  // Default to current calendar month
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  
  // Dialog state
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false)
  const [showAddMatchDialog, setShowAddMatchDialog] = useState(false)
  
  const displayDate = new Date(selectedYear, selectedMonth, 1)
  const currentMonth = displayDate.toLocaleString('en-US', { month: 'long' })
  const currentYear = selectedYear
  
  // Filter matches from selected calendar month
  const monthlyMatches = matches.filter(match => {
    const matchDate = new Date(match.played_at || match.created_at)
    return matchDate.getMonth() === selectedMonth && 
           matchDate.getFullYear() === selectedYear
  })
  
  // Get available months from August 2025 to current month
  const getAvailableMonths = () => {
    const months = []
    const startDate = new Date(2025, 7, 1) // August 2025 (month 7 = August)
    const currentDate = new Date()
    
    // Generate all months from August 2025 to current month
    let iterDate = new Date(startDate)
    while (iterDate <= currentDate) {
      months.push({
        year: iterDate.getFullYear(),
        month: iterDate.getMonth()
      })
      // Move to next month
      iterDate.setMonth(iterDate.getMonth() + 1)
    }
    
    // Sort descending (newest first)
    return months.sort((a, b) => {
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
    <div className="pt-12 pb-6 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-left">
          <h1 className="mb-3 text-[#171717]">Monthly Challenges</h1>
        </div>
        
        {/* Controls and Challenges Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            {/* Month and Style Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[#171717]">Select Month</h2>
              {availableMonths.length > 0 && (
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
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => setShowAddMatchDialog(true)}
                variant="primary"
                size="lg"
                className="rounded-full"
              >
                Add Match
              </Button>
              <Button
                onClick={() => setShowAddPlayerDialog(true)}
                variant="secondary"
                size="lg"
                className="rounded-full"
              >
                Add Player
              </Button>
            </div>
          </div>
          
          {/* Stat Boards Layout */}
          {isLoading && !hasLoadedOnce ? (
            <LoadingSpinner />
          ) : (
            <StatBoardsLayout 
              winners={winners} 
              monthlyMatches={monthlyMatches}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          )}
        </div>
      </div>
      
      {/* Dialogs */}
      <AddPlayerDialog
        isOpen={showAddPlayerDialog}
        onClose={() => setShowAddPlayerDialog(false)}
        onSubmit={addPlayer}
        players={players}
      />
      
      <AddMatchDialog
        isOpen={showAddMatchDialog}
        onClose={() => setShowAddMatchDialog(false)}
        onSubmit={addMatch}
        players={players}
      />
    </div>
  )
}

// Stat Boards Layout - Data-Dense Tables
function StatBoardsLayout({ winners, monthlyMatches, selectedMonth, selectedYear }) {
  const [expandedRows, setExpandedRows] = useState({})
  
  // Check if we have data
  const hasData = winners && monthlyMatches.length > 0
  
  // Check if selected month is in the past
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear
  const isPastMonth = selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth)
  
  // Format rivalries for display (only if we have data)
  const rivalriesForDisplay = hasData && winners.topRivalries ? winners.topRivalries.map(rivalry => ({
    player: {
      name: `${rivalry.player1.name} vs ${rivalry.player2.name}`
    },
    id: `${rivalry.player1Id}-${rivalry.player2Id}`,
    matchCount: rivalry.matchCount
  })) : []

  const challenges = [
    {
      id: 'mostPoints',
      title: 'Most Points Scored',
      icon: '⚡',
      description: 'Player who scored the most total points across all matches this month',
      allPlayers: hasData ? winners.mostPoints : [],
      getStatValue: (player) => player.totalPoints,
      statLabel: 'Total Points',
    },
    {
      id: 'highestElo',
      title: 'Highest ELO Score',
      icon: '👑',
      description: 'Player with the highest current ELO rating (skill level)',
      allPlayers: hasData ? winners.highestElo : [],
      getStatValue: (player) => player.elo_rating,
      statLabel: 'ELO Rating',
    },
    {
      id: 'winningStreak',
      title: 'Winning Streak',
      icon: '🔥',
      description: 'Longest consecutive wins in a row this month - who\'s on fire?',
      allPlayers: hasData ? winners.winningStreak : [],
      getStatValue: (player) => player.longestStreak,
      statLabel: 'Consecutive Wins',
    },
    {
      id: 'giantKiller',
      title: 'Giant Killer',
      icon: '🗡️',
      description: 'Most wins against higher-ranked opponents - underdog champion!',
      allPlayers: hasData ? winners.giantKiller : [],
      getStatValue: (player) => player.giantKillerWins,
      statLabel: 'Upset Wins',
    },
    {
      id: 'socialButterfly',
      title: 'Social Butterfly',
      icon: '🦋',
      description: 'Played against the most different opponents - great for team building!',
      allPlayers: hasData ? winners.socialButterfly : [],
      getStatValue: (player) => player.uniqueOpponentsCount,
      statLabel: 'Different Opponents',
    },
    {
      id: 'rivalryAward',
      title: 'Rivalry Award',
      icon: '⚔️',
      description: 'Two players who faced each other the most this month - fierce competition!',
      allPlayers: rivalriesForDisplay,
      getStatValue: (rivalry) => rivalry.matchCount,
      statLabel: 'Matches',
    },
    {
      id: 'bestDefense',
      title: 'Best Defense',
      icon: '🛡️',
      description: 'Lowest average points conceded per match - defensive excellence',
      allPlayers: hasData ? winners.leastPointsAgainst : [],
      getStatValue: (player) => player.avgPointsAgainst?.toFixed(1),
      statLabel: 'Avg Points Against',
    },
    {
      id: 'highestMatch',
      title: 'Highest Match Score',
      icon: '🔥',
      description: 'Most points scored in a single match - explosive performance!',
      allPlayers: hasData ? winners.mostPointsInMatch : [],
      getStatValue: (player) => player.maxPointsInMatch,
      statLabel: 'Max Points',
    },
    {
      id: 'eloSwing',
      title: 'Biggest ELO Swing',
      icon: '📈',
      description: 'Largest ELO change in a single match - dramatic upset or domination',
      allPlayers: hasData ? winners.biggestEloSwing : [],
      getStatValue: (player) => player.biggestEloSwing,
      statLabel: 'ELO Swing',
    },
    {
      id: 'biggestLoser',
      title: 'Biggest Loser',
      icon: '💀',
      description: 'Most losses this month - keep practicing, you\'ll get there!',
      allPlayers: hasData ? winners.biggestLoser : [],
      getStatValue: (player) => player.losses,
      statLabel: 'Losses',
    },
  ]
  
  const toggleRow = (challengeId) => {
    setExpandedRows(prev => ({
      ...prev,
      [challengeId]: !prev[challengeId]
    }))
  }
  
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow isHeader>
            <TableHeader width="lg">Challenge</TableHeader>
            <TableHeader width="xxl">Winner</TableHeader>
            <TableHeader width="md" className="text-right">Score</TableHeader>
            <TableHeader width="md" className="text-center">Participants</TableHeader>
            <TableHeader width="sm"></TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {challenges.map((challenge) => {
            const isEmpty = challenge.allPlayers.length === 0
            const topPlayer = challenge.allPlayers[0]
            const isExpanded = expandedRows[challenge.id]
            const hasMultiplePlayers = challenge.allPlayers.length > 1
            
            return (
              <React.Fragment key={challenge.id}>
                <TableRow className="cursor-pointer" onClick={() => hasMultiplePlayers && toggleRow(challenge.id)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{challenge.icon}</span>
                      <Tooltip text={challenge.description}>
                        <span className="font-medium text-gray-900 border-b border-dotted border-gray-400">
                          {challenge.title}
                        </span>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isEmpty ? (
                      <span className="text-sm text-gray-400 italic">
                        {isPastMonth ? 'Nobody stepped up this month... 🦗' : 'Be the first legend who plays this month! 🚀'}
                      </span>
                    ) : (
                      <span className="text-gray-900 font-medium">{topPlayer.player?.name || topPlayer.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!isEmpty && (
                      <span className="text-gray-900 font-semibold">{challenge.getStatValue(topPlayer)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {!isEmpty && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                        {challenge.allPlayers.length}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {hasMultiplePlayers && (
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg 
                          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </TableCell>
                </TableRow>
                
                {isExpanded && hasMultiplePlayers && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="py-3 px-4">
                        <div className="space-y-2">
                          {challenge.allPlayers.map((player, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2 px-4 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center gap-3">
                                <span className={`text-sm font-bold ${idx === 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                                  #{idx + 1}
                                </span>
                                <span className="text-gray-900">{player.player?.name || player.name}</span>
                              </div>
                              <span className="text-gray-700 font-semibold">
                                {challenge.getStatValue(player)} {challenge.statLabel}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
