// Script to import awards from CSV file
// Run this with: node scripts/import-awards-csv.js

const fs = require('fs')
const path = require('path')

const API_BASE = 'http://localhost:3000'
const CSV_PATH = '/Users/daanhekking/Downloads/monthly-awards-import.csv'

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

function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',')
  
  const awards = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const award = {
      player_id: values[0],
      category: values[1],
      month: parseInt(values[2]),
      year: parseInt(values[3]),
      month_name: values[4],
    }
    awards.push(award)
  }
  
  return awards
}

async function main() {
  try {
    console.log('📥 Reading CSV file...')
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8')
    
    console.log('📊 Parsing awards data...')
    const awards = parseCSV(csvContent)
    console.log(`   Found ${awards.length} awards to import\n`)
    
    // Group by month for display
    const byMonth = {}
    awards.forEach(award => {
      const key = `${award.month_name} ${award.year}`
      if (!byMonth[key]) byMonth[key] = []
      byMonth[key].push(award)
    })
    
    Object.entries(byMonth).forEach(([month, monthAwards]) => {
      console.log(`📅 ${month}: ${monthAwards.length} awards`)
    })
    
    console.log('\n💾 Saving awards to database...')
    await saveAwards(awards)
    
    console.log('✅ Successfully imported all awards!\n')
    console.log('🎉 Refresh your app to see the awards in Total Ranking.\n')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()

