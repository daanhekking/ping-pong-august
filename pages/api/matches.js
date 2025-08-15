import { supabase } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Fetch matches with player names via join
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          player1:player1_id(name),
          player2:player2_id(name),
          winner:winner_id(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return res.status(200).json(data)
    }

    if (req.method === 'POST') {
      const {
        player1_id,
        player2_id,
        player1_score,
        player2_score,
        player1_elo_change,
        player2_elo_change,
        winner_id
      } = req.body

      if (!player1_id || !player2_id) {
        return res.status(400).json({ error: 'Both player IDs are required' })
      }

      // Insert match into Supabase
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert([{
          player1_id,
          player2_id,
          player1_score,
          player2_score,
          player1_elo_change,
          player2_elo_change,
          winner_id
        }])
        .select()

      if (matchError) throw matchError

      // Fetch current stats for both players
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, elo_rating, matches_played, matches_won, matches_lost')
        .in('id', [player1_id, player2_id])

      if (playersError) throw playersError

      const player1 = players.find(p => p.id === player1_id)
      const player2 = players.find(p => p.id === player2_id)

      // Determine winners/losers
      const player1Won = winner_id === player1_id
      const player2Won = winner_id === player2_id

      // Update Player 1
      await supabase
        .from('players')
        .update({
          elo_rating: player1.elo_rating + player1_elo_change,
          matches_played: player1.matches_played + 1,
          matches_won: player1.matches_won + (player1Won ? 1 : 0),
          matches_lost: player1.matches_lost + (player1Won ? 0 : 1),
        })
        .eq('id', player1_id)

      // Update Player 2
      await supabase
        .from('players')
        .update({
          elo_rating: player2.elo_rating + player2_elo_change,
          matches_played: player2.matches_played + 1,
          matches_won: player2.matches_won + (player2Won ? 1 : 0),
          matches_lost: player2.matches_lost + (player2Won ? 0 : 1),
        })
        .eq('id', player2_id)

      return res.status(201).json(matchData[0])
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('API /matches error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
