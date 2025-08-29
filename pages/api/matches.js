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

    // Log the data being inserted
    console.log('Data to insert:', {
      player1_id,
      player2_id,
      player1_score,
      player2_score,
      winner_id,
      player1_elo_change,
      player2_elo_change,
      played_at
    })

    const playedAtValue = played_at ?? new Date().toISOString()

    try {
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
        console.error('Error details:', JSON.stringify(error, null, 2))
        
        // Check if this is a database trigger/function error
        if (error.message && error.message.includes('player1')) {
          console.error('This appears to be a database trigger/function error expecting "player1" field')
          console.error('The database schema may have triggers that expect different field names')
          console.error('SOLUTION: Check your database for triggers or functions that reference "player1" instead of "player1_id"')
        }
        
        return res.status(500).json({ 
          error: error.message,
          details: error,
          hint: 'Check database schema and constraints. This may be a database trigger expecting "player1" instead of "player1_id"'
        });
      }
      
      console.log('Match inserted successfully:', data)
      
      // Persist updated ELO and stats back to the players table so refresh shows correct values
      try {
        // Fetch current player rows
        const [{ data: p1, error: p1Err }, { data: p2, error: p2Err }] = await Promise.all([
          supabase
            .from('players')
            .select('elo_rating, matches_played, matches_won, matches_lost, name')
            .eq('id', player1_id)
            .single(),
          supabase
            .from('players')
            .select('elo_rating, matches_played, matches_won, matches_lost, name')
            .eq('id', player2_id)
            .single(),
        ])
        if (p1Err) throw p1Err
        if (p2Err) throw p2Err

        const player1Won = winner_id === player1_id ? 1 : 0
        const player2Won = winner_id === player2_id ? 1 : 0

        const [{ error: up1Err }, { error: up2Err }] = await Promise.all([
          supabase
            .from('players')
            .update({
              elo_rating: (p1?.elo_rating ?? 0) + player1_elo_change,
              matches_played: (p1?.matches_played ?? 0) + 1,
              matches_won: (p1?.matches_won ?? 0) + player1Won,
              matches_lost: (p1?.matches_lost ?? 0) + (1 - player1Won),
            })
            .eq('id', player1_id),
          supabase
            .from('players')
            .update({
              elo_rating: (p2?.elo_rating ?? 0) + player2_elo_change,
              matches_played: (p2?.matches_played ?? 0) + 1,
              matches_won: (p2?.matches_won ?? 0) + player2Won,
              matches_lost: (p2?.matches_lost ?? 0) + (1 - player2Won),
            })
            .eq('id', player2_id),
        ])

        if (up1Err) throw up1Err
        if (up2Err) throw up2Err
        
        console.log('Players updated successfully')
      } catch (updateErr) {
        console.error('Failed to update players after match insert:', updateErr)
        // Not failing the request since the match was recorded successfully,
        // but surfacing the problem for logs.
      }
      
      console.log('POST /api/matches successful, returning:', data)
      return res.status(200).json(data[0]); // Return first item since insert returns array
    } catch (err) {
      console.error('Unexpected error in POST /api/matches:', err)
      return res.status(500).json({ 
        error: 'Unexpected error', 
        details: err.message,
        stack: err.stack
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
