'use client'

import React, { useState } from 'react'
import { useData } from '../lib/DataContext'
import { LoadingSpinner } from './SkeletonLoaders'
import Button from './Button'

export default function ExportAwards() {
  const { players, matches, isLoading } = useData()
  const [selectedMonths, setSelectedMonths] = useState(['2025-7', '2025-8']) // August and September
  const [csvGenerated, setCsvGenerated] = useState(false)

  // Calculate winners for specific matches
  const calculateWinnersForMatches = (matchesForMonth) => {
    if (!matchesForMonth.length) return null
    
    const playerStats = {}
    
    // Initialize player stats
    players.forEach(player => {
      playerStats[player.id] = {
        player,
        totalPoints: 0,
        pointsAgainst: [],
        maxPointsInMatch: 0,
        biggestEloSwing: 0,
        losses: 0,
        currentStreak: 0,
        longestStreak: 0,
        giantKillerWins: 0,
        uniqueOpponents: new Set(),
      }
    })
    
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

  // Generate CSV content
  const generateCSV = () => {
    const csvRows = []
    
    // Header
    csvRows.push('player_id,category,month,year,month_name')
    
    selectedMonths.forEach(monthKey => {
      const [year, month] = monthKey.split('-').map(Number)
      
      // Filter matches for this month
      const monthMatches = matches.filter(match => {
        const matchDate = new Date(match.played_at || match.created_at)
        return matchDate.getMonth() === month && matchDate.getFullYear() === year
      })
      
      if (monthMatches.length > 0) {
        const winners = calculateWinnersForMatches(monthMatches)
        const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'long' })
        
        // Add award for each category winner
        const categories = [
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
        
        categories.forEach(({ key, winner }) => {
          if (winner) {
            const playerId = winner.player?.id || winner.id
            csvRows.push(`${playerId},${key},${month},${year},${monthName}`)
          }
        })
      }
    })
    
    return csvRows.join('\n')
  }

  // Download CSV file
  const downloadCSV = () => {
    const csv = generateCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'monthly-awards-import.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    setCsvGenerated(true)
    setTimeout(() => setCsvGenerated(false), 3000)
  }

  // Toggle month selection
  const toggleMonth = (monthKey) => {
    setSelectedMonths(prev => 
      prev.includes(monthKey) 
        ? prev.filter(m => m !== monthKey)
        : [...prev, monthKey]
    )
  }

  // Get available months from matches
  const getAvailableMonths = () => {
    const monthsSet = new Set()
    matches.forEach(match => {
      const matchDate = new Date(match.played_at || match.created_at)
      const monthKey = `${matchDate.getFullYear()}-${matchDate.getMonth()}`
      monthsSet.add(monthKey)
    })
    return Array.from(monthsSet).map(key => {
      const [year, month] = key.split('-')
      return { 
        key, 
        year: parseInt(year), 
        month: parseInt(month),
        name: new Date(parseInt(year), parseInt(month), 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
      }
    }).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })
  }

  const availableMonths = getAvailableMonths()

  if (isLoading) {
    return (
      <div className="pt-8 pb-6 px-6">
        <div className="max-w-4xl mx-auto">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="pt-8 pb-6 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-left">
          <h1 className="mb-3 text-[#171717]">Export Monthly Challenge Awards CSV</h1>
          <p className="text-gray-600">Generate a CSV file to import historical awards into your database</p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">📝 Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Select the months you want to export awards for</li>
            <li>Click "Generate CSV" to download the file</li>
            <li>Go to Supabase Dashboard → Table Editor → monthly_awards</li>
            <li>Click "Insert" → "Import data from CSV"</li>
            <li>Upload the downloaded CSV file</li>
            <li>Map the columns and import</li>
          </ol>
        </div>

        {/* Month Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Months to Export</h2>
          
          {availableMonths.length === 0 ? (
            <p className="text-gray-600">No matches found in database</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableMonths.map(({ key, name }) => {
                const matchCount = matches.filter(m => {
                  const [year, month] = key.split('-').map(Number)
                  const matchDate = new Date(m.played_at || m.created_at)
                  return matchDate.getMonth() === month && matchDate.getFullYear() === year
                }).length

                return (
                  <label
                    key={key}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedMonths.includes(key)
                        ? 'border-[#171717] bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMonths.includes(key)}
                      onChange={() => toggleMonth(key)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{name}</div>
                      <div className="text-sm text-gray-600">{matchCount} matches</div>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Ready to export?</h3>
              <p className="text-sm text-gray-600">
                {selectedMonths.length} month(s) selected • ~{selectedMonths.length * 9} awards
              </p>
            </div>
            <Button
              onClick={downloadCSV}
              variant="primary"
              size="lg"
              disabled={selectedMonths.length === 0}
            >
              📥 Generate CSV
            </Button>
          </div>
          
          {csvGenerated && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              ✓ CSV downloaded! Now import it to Supabase.
            </div>
          )}
        </div>

        {/* CSV Preview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">CSV Format Preview</h2>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <div className="text-gray-600">player_id,category,month,year,month_name</div>
            <div className="text-gray-900">uuid-here,mostPoints,7,2025,August</div>
            <div className="text-gray-900">uuid-here,highestElo,7,2025,August</div>
            <div className="text-gray-600">...</div>
          </div>
        </div>
      </div>
    </div>
  )
}

