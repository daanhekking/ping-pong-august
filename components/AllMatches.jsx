'use client'

import React from 'react'
import { LoadingSpinner } from './SkeletonLoaders'
import { useData } from '../lib/DataContext'
import Table, { TableContainer, TableHead, TableBody, TableHeader, TableRow, TableCell } from './Table'
import Chip from './Chip'

export default function AllMatches() {
  const { players, matches, isLoading, hasLoadedOnce } = useData()

  return (
    <div className="pt-8 pb-6 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-left">
          <h1 className="mb-3 text-[#171717]">All Matches</h1>
        </div>

        {/* All Matches Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="mb-4 text-[#171717]">Match History</h2>
          {isLoading && !hasLoadedOnce ? (
            <LoadingSpinner />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow isHeader>
                    <TableHeader width="lg">Player 1</TableHeader>
                    <TableHeader width="md">Score</TableHeader>
                    <TableHeader width="lg">Player 2</TableHeader>
                    <TableHeader width="xl">Played</TableHeader>
                    <TableHeader width="lg">ELO Change</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(Array.isArray(matches) ? matches : []).map((m) => {
                    const player1 = players.find((p) => p.id === m.player1_id)
                    const player2 = players.find((p) => p.id === m.player2_id)
                    const player1Won = m.winner_id === m.player1_id
                    const player2Won = m.winner_id === m.player2_id
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <Chip
                            variant={player1Won ? 'success' : player2Won ? 'danger' : 'default'}
                            size="md"
                          >
                            {player1 ? player1.name : 'Unknown'}
                          </Chip>
                        </TableCell>
                        <TableCell className="font-medium">
                          {m.player1_score} - {m.player2_score}
                        </TableCell>
                        <TableCell>
                          <Chip
                            variant={player2Won ? 'success' : player1Won ? 'danger' : 'default'}
                            size="md"
                          >
                            {player2 ? player2.name : 'Unknown'}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          {(m.played_at || m.created_at) 
                            ? new Date(m.played_at || m.created_at).toLocaleString('nb-NO', { 
                                timeZone: 'Europe/Oslo', 
                                year: 'numeric', month: '2-digit', day: '2-digit', 
                                hour: '2-digit', minute: '2-digit' 
                              }) 
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className={m.player1_elo_change > 0 ? 'text-green-600' : 'text-red-600'}>
                              {m.player1_elo_change > 0 && '+'}{m.player1_elo_change}
                            </span>
                            <span className="text-gray-400 mx-1">/</span>
                            <span className={m.player2_elo_change > 0 ? 'text-green-600' : 'text-red-600'}>
                              {m.player2_elo_change > 0 && '+'}{m.player2_elo_change}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {!isLoading && matches.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No matches found. Start playing to see match history!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
