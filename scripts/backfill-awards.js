// Script to backfill awards for August and September 2025
// Run this with: node scripts/backfill-awards.js

const API_BASE = 'http://localhost:3000'

// Month configurations to backfill
const MONTHS_TO_BACKFILL = [
  { month: 7, year: 2025, name: 'August' },  // August (0-indexed, so 7)
  { month: 8, year: 2025, name: 'September' }, // September
]

async function fetchData(endpoint) {
  const response = await fetch(`${API_BASE}/api/${endpoint}`)
  if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`)
  return response.json()
}

async function saveAwards(awards) {
  const response = await fetch(`${API_BASE}/api/monthly-awards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ awards }),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to save awards: ${response.status} - ${errorText}`)
  }
  return response.json()
}

function calculateWinners(players, matches, month, year) {
  // Filter matches for this specific month
  const monthMatches = matches.filter(m => {
    const matchDate = new Date(m.played_at || m.created_at)
    return matchDate.getMonth() === month && matchDate.getFullYear() === year
  })

  if (monthMatches.length === 0) {
    console.log(`No matches found for ${month + 1}/${year}`)
    return null
  }

  // Calculate stats for each player
  const playerStats = {}
  players.forEach(p => {
    playerStats[p.id] = {
      player: p,
      totalPoints: 0,
      matches: [],
      wins: 0,
      losses: 0,
      pointsAgainst: [],
      opponents: new Set(),
      currentStreak: 0,
      longestStreak: 0,
      giantKillerWins: 0,
    }
  })

  // Process matches chronologically for streak calculation
  const sortedMatches = monthMatches.slice().sort((a, b) => 
    new Date(a.played_at || a.created_at) - new Date(b.played_at || b.created_at)
  )

  sortedMatches.forEach(match => {
    const p1Stats = playerStats[match.player1_id]
    const p2Stats = playerStats[match.player2_id]
    
    if (!p1Stats || !p2Stats) return

    // Track points
    p1Stats.totalPoints += match.player1_score
    p2Stats.totalPoints += match.player2_score
    
    // Track matches
    p1Stats.matches.push(match)
    p2Stats.matches.push(match)
    
    // Track points against
    p1Stats.pointsAgainst.push(match.player2_score)
    p2Stats.pointsAgainst.push(match.player1_score)
    
    // Track opponents
    p1Stats.opponents.add(match.player2_id)
    p2Stats.opponents.add(match.player1_id)
    
    // Track wins/losses and streaks
    if (match.winner_id === match.player1_id) {
      p1Stats.wins++
      p2Stats.losses++
      
      // Player 1 wins
      p1Stats.currentStreak++
      p1Stats.longestStreak = Math.max(p1Stats.longestStreak, p1Stats.currentStreak)
      p2Stats.currentStreak = 0
      
      // Giant killer check
      if (p2Stats.player.elo_rating > p1Stats.player.elo_rating) {
        p1Stats.giantKillerWins++
      }
    } else {
      p2Stats.wins++
      p1Stats.losses++
      
      // Player 2 wins
      p2Stats.currentStreak++
      p2Stats.longestStreak = Math.max(p2Stats.longestStreak, p2Stats.currentStreak)
      p1Stats.currentStreak = 0
      
      // Giant killer check
      if (p1Stats.player.elo_rating > p2Stats.player.elo_rating) {
        p2Stats.giantKillerWins++
      }
    }
  })

  // Calculate averages and find winners
  const playersWithStats = Object.values(playerStats).filter(ps => ps.matches.length > 0)
  
  playersWithStats.forEach(ps => {
    ps.avgPointsAgainst = ps.pointsAgainst.reduce((a, b) => a + b, 0) / ps.pointsAgainst.length
    ps.maxPointsInMatch = Math.max(...ps.matches.map(m => 
      m.player1_id === ps.player.id ? m.player1_score : m.player2_score
    ))
    ps.biggestEloSwing = Math.max(...ps.matches.map(m => 
      Math.abs(m.player1_id === ps.player.id ? m.player1_elo_change : m.player2_elo_change)
    ))
    ps.uniqueOpponentsCount = ps.opponents.size
  })

  // Calculate rivalries
  const rivalryMap = {}
  monthMatches.forEach(match => {
    const key = [match.player1_id, match.player2_id].sort().join('-')
    if (!rivalryMap[key]) {
      rivalryMap[key] = {
        player1Id: match.player1_id,
        player2Id: match.player2_id,
        count: 0
      }
    }
    rivalryMap[key].count++
  })

  const topRivalry = Object.values(rivalryMap)
    .sort((a, b) => b.count - a.count)[0]

  // Find winners for each category
  const winners = {
    mostPoints: [...playersWithStats].sort((a, b) => b.totalPoints - a.totalPoints)[0],
    highestElo: [...playersWithStats].sort((a, b) => b.player.elo_rating - a.player.elo_rating)[0],
    winningStreak: [...playersWithStats].sort((a, b) => b.longestStreak - a.longestStreak)[0],
    giantKiller: [...playersWithStats].sort((a, b) => b.giantKillerWins - a.giantKillerWins)[0],
    socialButterfly: [...playersWithStats].sort((a, b) => b.uniqueOpponentsCount - a.uniqueOpponentsCount)[0],
    bestDefense: [...playersWithStats].sort((a, b) => a.avgPointsAgainst - b.avgPointsAgainst)[0],
    highestMatch: [...playersWithStats].sort((a, b) => b.maxPointsInMatch - a.maxPointsInMatch)[0],
    eloSwing: [...playersWithStats].sort((a, b) => b.biggestEloSwing - a.biggestEloSwing)[0],
    biggestLoser: [...playersWithStats].sort((a, b) => b.losses - a.losses)[0],
    rivalry: topRivalry,
  }

  return winners
}

async function main() {
  try {
    console.log('🏓 Starting awards backfill process...\n')

    // Fetch current data
    console.log('📥 Fetching players and matches...')
    const players = await fetchData('players')
    const matches = await fetchData('matches')
    console.log(`   Found ${players.length} players and ${matches.length} matches\n`)

    const allAwards = []

    // Process each month
    for (const { month, year, name } of MONTHS_TO_BACKFILL) {
      console.log(`\n📅 Processing ${name} ${year}...`)
      
      const winners = calculateWinners(players, matches, month, year)
      
      if (!winners) {
        console.log(`   ⚠️  Skipping ${name} - no matches found`)
        continue
      }

      const monthAwards = []

      // Add individual awards
      const categories = [
        { key: 'mostPoints', category: 'mostPoints' },
        { key: 'highestElo', category: 'highestElo' },
        { key: 'winningStreak', category: 'winningStreak' },
        { key: 'giantKiller', category: 'giantKiller' },
        { key: 'socialButterfly', category: 'socialButterfly' },
        { key: 'bestDefense', category: 'bestDefense' },
        { key: 'highestMatch', category: 'highestMatch' },
        { key: 'eloSwing', category: 'eloSwing' },
        { key: 'biggestLoser', category: 'biggestLoser' },
      ]

      categories.forEach(({ key, category }) => {
        if (winners[key] && winners[key].player) {
          monthAwards.push({
            player_id: winners[key].player.id,
            category: category,
            month: month + 1, // Convert to 1-indexed
            year: year,
            month_name: name,
          })
          console.log(`   ✓ ${category}: ${winners[key].player.name}`)
        }
      })

      // Add rivalry awards (both players)
      if (winners.rivalry) {
        const player1 = players.find(p => p.id === winners.rivalry.player1Id)
        const player2 = players.find(p => p.id === winners.rivalry.player2Id)
        
        if (player1) {
          monthAwards.push({
            player_id: player1.id,
            category: 'rivalryAward',
            month: month + 1,
            year: year,
            month_name: name,
          })
          console.log(`   ✓ rivalryAward: ${player1.name}`)
        }
        
        if (player2) {
          monthAwards.push({
            player_id: player2.id,
            category: 'rivalryAward',
            month: month + 1,
            year: year,
            month_name: name,
          })
          console.log(`   ✓ rivalryAward: ${player2.name}`)
        }
      }

      allAwards.push(...monthAwards)
      console.log(`   📊 Total awards for ${name}: ${monthAwards.length}`)
    }

    // Save all awards
    if (allAwards.length > 0) {
      console.log(`\n💾 Saving ${allAwards.length} total awards to database...`)
      await saveAwards(allAwards)
      console.log('✅ Awards saved successfully!\n')
      console.log('🎉 Backfill complete! Refresh your app to see the awards.\n')
    } else {
      console.log('\n⚠️  No awards to save.\n')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()

