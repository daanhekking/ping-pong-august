'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/router'
import { useData } from '../lib/DataContext'
import { LoadingSpinner } from './SkeletonLoaders'
import Chip from './Chip'
import Table, { TableContainer, TableHead, TableBody, TableHeader, TableRow, TableCell } from './Table'

// Award icon and name mapping
const AWARD_ICONS = {
  mostPoints: '⚡',
  highestElo: '👑',
  winningStreak: '🔥',
  giantKiller: '🗡️',
  socialButterfly: '🦋',
  rivalryAward: '⚔️',
  bestDefense: '🛡️',
  highestMatch: '💥',
  eloSwing: '📈',
  biggestLoser: '💀',
}

const AWARD_NAMES = {
  mostPoints: 'Most Points Scored',
  highestElo: 'Highest ELO Score',
  winningStreak: 'Winning Streak',
  giantKiller: 'Giant Killer',
  socialButterfly: 'Social Butterfly',
  rivalryAward: 'Rivalry Award',
  bestDefense: 'Best Defense',
  highestMatch: 'Highest Single Match Score',
  eloSwing: 'Biggest ELO Swing',
  biggestLoser: 'Biggest Loser',
}

export default function PlayerDetail({ playerId }) {
  const router = useRouter()
  const { players, matches, monthlyAwards, isLoading } = useData()

  // Find the player
  const player = useMemo(() => {
    return players.find(p => p.id === playerId)
  }, [players, playerId])

  // Get player's awards
  const playerAwards = useMemo(() => {
    return monthlyAwards.filter(award => award.player_id === playerId)
  }, [monthlyAwards, playerId])

  // Get player's matches
  const playerMatches = useMemo(() => {
    return matches
      .filter(match => match.player1_id === playerId || match.player2_id === playerId)
      .sort((a, b) => new Date(b.played_at || b.created_at) - new Date(a.played_at || a.created_at))
  }, [matches, playerId])

  // Group awards by month
  const awardsByMonth = useMemo(() => {
    const grouped = {}
    playerAwards.forEach(award => {
      const key = `${award.month_name} ${award.year}`
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(award)
    })
    return grouped
  }, [playerAwards])

  if (isLoading) {
    return (
      <div className="pt-8 pb-6 px-6">
        <div className="max-w-6xl mx-auto">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="pt-8 pb-6 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🤷</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Player not found</h3>
            <p className="text-gray-600 mb-6">This player doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push('/rankings')}
              className="px-4 py-2 bg-[#171717] text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Back to Rankings
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-8 pb-6 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>

        {/* Player Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#171717] to-gray-700 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                {player.name[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#171717] mb-2">{player.name}</h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">ELO:</span>
                    <span className="text-lg font-bold text-[#171717]">{player.elo_rating}</span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Matches:</span>
                    <span className="font-semibold">{player.matches_played}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Win/Loss Stats */}
            <div className="flex gap-4">
              <div className="text-center px-6 py-4 bg-green-50 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-700">{player.matches_won}</div>
                <div className="text-xs text-green-600 uppercase tracking-wide">Wins</div>
              </div>
              <div className="text-center px-6 py-4 bg-red-50 rounded-xl border border-red-200">
                <div className="text-2xl font-bold text-red-700">{player.matches_lost}</div>
                <div className="text-xs text-red-600 uppercase tracking-wide">Losses</div>
              </div>
              <div className="text-center px-6 py-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">
                  {player.matches_played > 0 
                    ? Math.round((player.matches_won / player.matches_played) * 100) 
                    : 0}%
                </div>
                <div className="text-xs text-blue-600 uppercase tracking-wide">Win Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Awards Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span>🏆</span>
            <span>Monthly Challenge Awards</span>
            <span className="text-sm font-normal text-gray-500">({playerAwards.length} total)</span>
          </h2>

          {playerAwards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-20">🏆</div>
              <p className="text-gray-500">No awards won yet</p>
              <p className="text-gray-400 text-sm mt-2">Keep playing to earn monthly challenge awards!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(awardsByMonth)
                .sort((a, b) => {
                  // Sort by date descending
                  const [aMonth, aYear] = a[0].split(' ')
                  const [bMonth, bYear] = b[0].split(' ')
                  if (aYear !== bYear) return parseInt(bYear) - parseInt(aYear)
                  return new Date(`${aMonth} 1, ${aYear}`) - new Date(`${bMonth} 1, ${bYear}`)
                })
                .map(([monthYear, awards]) => (
                  <div key={monthYear} className="border-l-4 border-yellow-400 pl-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{monthYear}</h3>
                    <div className="flex flex-wrap gap-3">
                      {awards.map((award, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg"
                        >
                          <span className="text-2xl">{AWARD_ICONS[award.category] || '🏆'}</span>
                          <span className="font-medium text-gray-900">
                            {AWARD_NAMES[award.category] || award.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Match History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span>📊</span>
            <span>Match History</span>
            <span className="text-sm font-normal text-gray-500">({playerMatches.length} matches)</span>
          </h2>

          {playerMatches.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-20">🏓</div>
              <p className="text-gray-500">No matches played yet</p>
              <p className="text-gray-400 text-sm mt-2">Start playing to build your match history!</p>
            </div>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow isHeader>
                    <TableHeader width="lg">Opponent</TableHeader>
                    <TableHeader width="sm">Result</TableHeader>
                    <TableHeader width="md">Score</TableHeader>
                    <TableHeader width="xl">Date</TableHeader>
                    <TableHeader width="sm">ELO</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {playerMatches.map((match) => {
                    const isPlayer1 = match.player1_id === playerId
                    const opponent = players.find(p => p.id === (isPlayer1 ? match.player2_id : match.player1_id))
                    const won = match.winner_id === playerId
                    const playerScore = isPlayer1 ? match.player1_score : match.player2_score
                    const opponentScore = isPlayer1 ? match.player2_score : match.player1_score
                    const eloChange = isPlayer1 ? match.player1_elo_change : match.player2_elo_change

                    return (
                      <TableRow key={match.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {opponent?.name || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip variant={won ? 'success' : 'danger'} size="sm">
                            {won ? 'Won' : 'Lost'}
                          </Chip>
                        </TableCell>
                        <TableCell className="font-medium">
                          {playerScore} - {opponentScore}
                        </TableCell>
                        <TableCell text="muted">
                          {(match.played_at || match.created_at) 
                            ? new Date(match.played_at || match.created_at).toLocaleString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) 
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${eloChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {eloChange > 0 && '+'}{eloChange}
                          </span>
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
    </div>
  )
}

