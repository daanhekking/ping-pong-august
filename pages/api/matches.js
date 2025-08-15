import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    console.log('GET /api/matches called')
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false }); // Always newest first

    if (error) {
      console.error('Supabase error in GET /api/matches:', error)
      return res.status(500).json({ error: error.message });
    }
    
    console.log('GET /api/matches returning data:', data)
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    console.log('POST /api/matches called with body:', req.body)
    
    const {
      player1_id,
      player2_id,
      player1_score,
      player2_score,
      winner_id,
      player1_elo_change,
      player2_elo_change
    } = req.body;

    // Validate required fields
    if (!player1_id || !player2_id || player1_score === undefined || player2_score === undefined) {
      console.error('Missing required fields in POST /api/matches')
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('matches')
      .insert([{
        player1_id,
        player2_id,
        player1_score,
        player2_score,
        winner_id,
        player1_elo_change,
        player2_elo_change
      }])
      .select('*'); // Return inserted match

    if (error) {
      console.error('Supabase error in POST /api/matches:', error)
      return res.status(500).json({ error: error.message });
    }
    
    console.log('POST /api/matches successful, returning:', data)
    return res.status(200).json(data[0]); // Return first item since insert returns array
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
