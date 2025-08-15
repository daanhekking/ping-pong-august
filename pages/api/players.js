import { supabase } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Fetch players ordered by ELO rating
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('elo_rating', { ascending: false })

      if (error) throw error
      return res.status(200).json(data)
    }

    if (req.method === 'POST') {
      const { name } = req.body
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Player name is required' })
      }

      const { data, error } = await supabase
        .from('players')
        .insert([{
          name: name.trim(),
          elo_rating: 1000,
          matches_played: 0,
          matches_won: 0,
          matches_lost: 0
        }])
        .select()

      if (error) throw error
      return res.status(201).json(data[0])
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('API /players error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
