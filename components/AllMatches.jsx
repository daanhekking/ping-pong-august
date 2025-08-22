'use client'

import React from 'react'
import { LoadingSpinner } from './SkeletonLoaders'
import { useData } from '../lib/DataContext'

export default function AllMatches() {
  const { players, matches, isLoading, hasLoadedOnce } = useData()



  return (
    <div className="py-8 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">All Matches</h1>
          <p className="text-lg text-gray-600">Complete match history and results</p>
        </div>

        {/* All Matches Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Match History</h2>
          {isLoading && !hasLoadedOnce ? (
            <LoadingSpinner />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 w-32">Player 1</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 w-24">Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 w-32">Player 2</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 w-40">Played</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 w-32">ELO Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(Array.isArray(matches) ? matches : []).map((m) => {
                    const player1 = players.find((p) => p.id === m.player1_id)
                    const player2 = players.find((p) => p.id === m.player2_id)
                    const player1Won = m.winner_id === m.player1_id
                    const player2Won = m.winner_id === m.player2_id
                    return (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            player1Won ? 'bg-green-100 text-green-800' : player2Won ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {player1 ? player1.name : 'Unknown'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-700 font-semibold">
                          {m.player1_score} - {m.player2_score}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            player2Won ? 'bg-green-100 text-green-800' : player1Won ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {player2 ? player2.name : 'Unknown'}
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
          )}
          
          {!isLoading && matches.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No matches found. Start playing to see match history!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
