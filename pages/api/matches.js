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
      const { data, error } = await supabase
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

      if (error) throw error

      // Update players' stats (matches played, won, lost, and ELO)
      await supabase.rpc('update_player_stats', { player_id: player1_id })
      await supabase.rpc('update_player_stats', { player_id: player2_id })

      return res.status(201).json(data[0])
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('API /matches error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
