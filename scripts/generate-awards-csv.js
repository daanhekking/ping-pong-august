/**
 * Script to generate a CSV file with monthly awards for import to Supabase
 * 
 * Run with: node scripts/generate-awards-csv.js
 * 
 * This will create awards-import.csv in the scripts folder
 */

const fs = require('fs');
const path = require('path');

// You'll need to fetch your actual data from Supabase
// For now, this is a template - you can either:
// 1. Export your players and matches data from Supabase and paste here
// 2. Or modify this to fetch from your API

// STEP 1: Replace this with your actual player data from Supabase
// Export from Supabase: SELECT * FROM players;
const PLAYERS = [
  // Example format:
  // { id: 'uuid-here', name: 'Player Name', elo_rating: 1500 }
];

// STEP 2: Replace this with your actual match data from Supabase
// Export from Supabase: SELECT * FROM matches WHERE played_at >= '2025-08-01' AND played_at < '2025-10-01';
const MATCHES = [
  // Example format:
  // { id: 'uuid', player1_id: 'uuid', player2_id: 'uuid', player1_score: 11, player2_score: 9, winner_id: 'uuid', player1_elo_change: 16, player2_elo_change: -16, played_at: '2025-08-15T10:00:00Z' }
];

// Award category mappings
const CATEGORIES = {
  mostPoints: 'mostPoints',
  highestElo: 'highestElo',
  winningStreak: 'winningStreak',
  giantKiller: 'giantKiller',
  socialButterfly: 'socialButterfly',
  bestDefense: 'bestDefense',
  highestMatch: 'highestMatch',
  eloSwing: 'eloSwing',
  biggestLoser: 'biggestLoser',
};

// Calculate winners for a specific month
function calculateMonthlyWinners(matches, players, month, year) {
  const playerStats = {};
  
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
    };
  });
  
  // Sort matches by date for streak calculation
  const sortedMatches = [...matches].sort((a, b) => 
    new Date(a.played_at || a.created_at) - new Date(b.played_at || b.created_at)
  );
  
  // Calculate stats from matches
  sortedMatches.forEach(match => {
    const p1Stats = playerStats[match.player1_id];
    const p2Stats = playerStats[match.player2_id];
    
    if (p1Stats && p2Stats) {
      const player1 = p1Stats.player;
      const player2 = p2Stats.player;
      
      p1Stats.totalPoints += match.player1_score;
      p2Stats.totalPoints += match.player2_score;
      
      p1Stats.pointsAgainst.push(match.player2_score);
      p2Stats.pointsAgainst.push(match.player1_score);
      
      p1Stats.maxPointsInMatch = Math.max(p1Stats.maxPointsInMatch, match.player1_score);
      p2Stats.maxPointsInMatch = Math.max(p2Stats.maxPointsInMatch, match.player2_score);
      
      p1Stats.biggestEloSwing = Math.max(p1Stats.biggestEloSwing, Math.abs(match.player1_elo_change || 0));
      p2Stats.biggestEloSwing = Math.max(p2Stats.biggestEloSwing, Math.abs(match.player2_elo_change || 0));
      
      if (match.winner_id === match.player2_id) {
        p1Stats.losses += 1;
        p1Stats.currentStreak = 0;
        p2Stats.currentStreak += 1;
        p2Stats.longestStreak = Math.max(p2Stats.longestStreak, p2Stats.currentStreak);
      } else if (match.winner_id === match.player1_id) {
        p2Stats.losses += 1;
        p2Stats.currentStreak = 0;
        p1Stats.currentStreak += 1;
        p1Stats.longestStreak = Math.max(p1Stats.longestStreak, p1Stats.currentStreak);
      }
      
      if (match.winner_id === match.player1_id && player1.elo_rating < player2.elo_rating) {
        p1Stats.giantKillerWins += 1;
      } else if (match.winner_id === match.player2_id && player2.elo_rating < player1.elo_rating) {
        p2Stats.giantKillerWins += 1;
      }
      
      p1Stats.uniqueOpponents.add(match.player2_id);
      p2Stats.uniqueOpponents.add(match.player1_id);
    }
  });
  
  const playersWithStats = Object.values(playerStats).filter(p => p.pointsAgainst.length > 0);
  
  playersWithStats.forEach(stats => {
    stats.avgPointsAgainst = stats.pointsAgainst.reduce((a, b) => a + b, 0) / stats.pointsAgainst.length;
    stats.uniqueOpponentsCount = stats.uniqueOpponents.size;
  });
  
  return {
    mostPoints: [...playersWithStats].sort((a, b) => b.totalPoints - a.totalPoints)[0],
    highestElo: [...players].sort((a, b) => b.elo_rating - a.elo_rating)[0],
    leastPointsAgainst: [...playersWithStats].sort((a, b) => a.avgPointsAgainst - b.avgPointsAgainst)[0],
    mostPointsInMatch: [...playersWithStats].sort((a, b) => b.maxPointsInMatch - a.maxPointsInMatch)[0],
    biggestEloSwing: [...playersWithStats].sort((a, b) => b.biggestEloSwing - a.biggestEloSwing)[0],
    biggestLoser: [...playersWithStats].sort((a, b) => b.losses - a.losses)[0],
    winningStreak: [...playersWithStats].sort((a, b) => b.longestStreak - a.longestStreak)[0],
    giantKiller: [...playersWithStats].sort((a, b) => b.giantKillerWins - a.giantKillerWins)[0],
    socialButterfly: [...playersWithStats].sort((a, b) => b.uniqueOpponentsCount - a.uniqueOpponentsCount)[0],
  };
}

// Generate CSV rows for awards
function generateAwardsCSV() {
  if (PLAYERS.length === 0 || MATCHES.length === 0) {
    console.error('\n❌ ERROR: No player or match data found!');
    console.log('\nPlease follow these steps:');
    console.log('1. Go to Supabase SQL Editor');
    console.log('2. Run: SELECT * FROM players;');
    console.log('3. Copy the results and paste into PLAYERS array in this script');
    console.log('4. Run: SELECT * FROM matches WHERE played_at >= \'2025-08-01\';');
    console.log('5. Copy the results and paste into MATCHES array in this script');
    console.log('6. Run this script again\n');
    return null;
  }

  const csvRows = [];
  
  // CSV Header
  csvRows.push('player_id,category,month,year,month_name');
  
  // Process August (month 7)
  const augustMatches = MATCHES.filter(m => {
    const date = new Date(m.played_at || m.created_at);
    return date.getMonth() === 7 && date.getFullYear() === 2025;
  });
  
  if (augustMatches.length > 0) {
    const augustWinners = calculateMonthlyWinners(augustMatches, PLAYERS, 7, 2025);
    
    Object.entries(augustWinners).forEach(([category, winner]) => {
      if (winner && winner.player) {
        const playerId = winner.player.id || winner.id;
        csvRows.push(`${playerId},${category},7,2025,August`);
      }
    });
    
    console.log(`✓ Found ${Object.keys(augustWinners).length} August winners`);
  } else {
    console.log('⚠ No matches found for August 2025');
  }
  
  // Process September (month 8)
  const septemberMatches = MATCHES.filter(m => {
    const date = new Date(m.played_at || m.created_at);
    return date.getMonth() === 8 && date.getFullYear() === 2025;
  });
  
  if (septemberMatches.length > 0) {
    const septemberWinners = calculateMonthlyWinners(septemberMatches, PLAYERS, 8, 2025);
    
    Object.entries(septemberWinners).forEach(([category, winner]) => {
      if (winner && winner.player) {
        const playerId = winner.player.id || winner.id;
        csvRows.push(`${playerId},${category},8,2025,September`);
      }
    });
    
    console.log(`✓ Found ${Object.keys(septemberWinners).length} September winners`);
  } else {
    console.log('⚠ No matches found for September 2025');
  }
  
  return csvRows.join('\n');
}

// Main execution
console.log('🏆 Generating Monthly Awards CSV...\n');

const csvContent = generateAwardsCSV();

if (csvContent) {
  const outputPath = path.join(__dirname, 'awards-import.csv');
  fs.writeFileSync(outputPath, csvContent);
  
  console.log(`\n✅ CSV file created: ${outputPath}`);
  console.log('\nNext steps:');
  console.log('1. Go to Supabase Dashboard');
  console.log('2. Navigate to Table Editor > monthly_awards');
  console.log('3. Click "Insert" > "Import data from CSV"');
  console.log('4. Upload awards-import.csv');
  console.log('5. Map columns and import\n');
} else {
  console.log('Please update the PLAYERS and MATCHES arrays with your data.\n');
}

