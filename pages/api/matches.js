import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    console.log('GET /api/matches called')
    
    try {
      // Test Supabase connection first
      console.log('Testing Supabase connection...')
      
      // Fetch matches ordered by played_at (new column)
      console.log('Attempting to fetch matches ordered by played_at...')
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('played_at', { ascending: false })

      if (error) {
        console.error('Supabase error in GET /api/matches:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return res.status(500).json({ 
          error: error.message, 
          details: error,
          hint: 'Check if matches table exists and has correct structure'
        });
      }
      
      console.log('GET /api/matches returning data:', data)
      return res.status(200).json(data);
    } catch (err) {
      console.error('Unexpected error in GET /api/matches:', err)
      return res.status(500).json({ error: 'Unexpected error', details: err.message });
    }
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
      player2_elo_change,
      played_at
    } = req.body;

    // Validate required fields
    if (!player1_id || !player2_id || player1_score === undefined || player2_score === undefined) {
      console.error('Missing required fields in POST /api/matches')
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const playedAtValue = played_at ?? new Date().toISOString()

    const { data, error } = await supabase
      .from('matches')
      .insert([{
        player1_id,
        player2_id,
        player1_score,
        player2_score,
        winner_id,
        player1_elo_change,
        player2_elo_change,
        played_at: playedAtValue
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
