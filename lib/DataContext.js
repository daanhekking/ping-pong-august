'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const DataContext = createContext()

export function DataProvider({ children }) {
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [monthlyAwards, setMonthlyAwards] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState(null)

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000

  // Check if cache is still valid
  const isCacheValid = useCallback(() => {
    if (!lastFetchTime) return false
    return Date.now() - lastFetchTime < CACHE_DURATION
  }, [lastFetchTime])

  // Fetch players from API
  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch('/api/players')
      if (!res.ok) throw new Error('Failed to fetch players')
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error('Players data is not an array')
      return data
    } catch (err) {
      console.error('Failed to fetch players:', err)
      return []
    }
  }, [])

  // Fetch matches from API
  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/matches')
      if (!res.ok) throw new Error('Failed to fetch matches')
      let data = await res.json()

      if (!Array.isArray(data)) {
        console.error('Matches data is not an array:', typeof data, data)
        return []
      }

      // Ensure newest matches show first in UI (prefer played_at, fallback created_at)
      data.sort((a, b) => new Date(b.played_at || b.created_at) - new Date(a.played_at || a.created_at))
      
      return data
    } catch (err) {
      console.error('Failed to fetch matches:', err)
      return []
    }
  }, [])

  // Fetch monthly awards from API
  const fetchMonthlyAwards = useCallback(async () => {
    try {
      const res = await fetch('/api/monthly-awards')
      if (!res.ok) throw new Error('Failed to fetch monthly awards')
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error('Monthly awards data is not an array')
      return data
    } catch (err) {
      console.error('Failed to fetch monthly awards:', err)
      return []
    }
  }, [])

  // Load all data (players + matches + awards)
  const loadAllData = useCallback(async (forceRefresh = false) => {
    // If cache is valid and we have data, don't fetch
    if (!forceRefresh && isCacheValid() && players.length > 0 && matches.length > 0) {
      console.log('Using cached data, no need to fetch')
      setIsLoading(false)
      return
    }

    console.log('Fetching fresh data from database...')
    setIsLoading(true)

    try {
      // Fetch players, matches, and awards concurrently
      const [playersData, matchesData, awardsData] = await Promise.all([
        fetchPlayers(),
        fetchMatches(),
        fetchMonthlyAwards()
      ])

      setPlayers(playersData)
      setMatches(matchesData)
      setMonthlyAwards(awardsData)
      setLastFetchTime(Date.now())
      setHasLoadedOnce(true)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchPlayers, fetchMatches, fetchMonthlyAwards, isCacheValid])

  // Refresh data (used after adding players/matches)
  const refreshData = useCallback(() => {
    loadAllData(true)
  }, [loadAllData])

  // Add a new player and refresh data
  const addPlayer = useCallback(async (playerData) => {
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playerData),
      })
      if (!res.ok) throw new Error('Failed to add player')
      const addedPlayer = await res.json()
      
      // Refresh all data to get the latest state
      await refreshData()
      
      return addedPlayer
    } catch (err) {
      throw err
    }
  }, [refreshData])

  // Add a new match and refresh data
  const addMatch = useCallback(async (matchData) => {
    try {
      console.log('Sending match data to API:', matchData)
      
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData),
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API error response:', errorData)
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`)
      }
      
      const newMatch = await res.json()
      console.log('Match added successfully:', newMatch)
      
      // Refresh all data to get the latest state
      await refreshData()
      
      return newMatch
    } catch (err) {
      console.error('Error adding match:', err)
      throw err
    }
  }, [refreshData])

  // Load data on mount
  useEffect(() => {
    loadAllData()
  }, []) // Empty dependency array to avoid infinite loops

  const value = {
    // Data
    players,
    matches,
    monthlyAwards,
    
    // Loading state
    isLoading,
    hasLoadedOnce,
    
    // Actions
    loadAllData,
    refreshData,
    addPlayer,
    addMatch,
    
    // Cache info
    lastFetchTime,
    isCacheValid: isCacheValid()
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
