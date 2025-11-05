import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('played_at', { ascending: false })

      if (error) {
        console.error('Supabase error in GET /api/matches:', error)
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(200).json(data);
    } catch (err) {
      console.error('Unexpected error in GET /api/matches:', err)
      return res.status(500).json({ error: 'Unexpected error' });
    }
  }

  if (req.method === 'POST') {
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
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const playedAtValue = played_at ?? new Date().toISOString()

    try {
      // Calculate ELO changes if not provided
      let finalPlayer1EloChange = player1_elo_change;
      let finalPlayer2EloChange = player2_elo_change;
      
      if (finalPlayer1EloChange === undefined || finalPlayer2EloChange === undefined) {
        // Fetch current player ELO ratings
        const [{ data: player1Data, error: p1Error }, { data: player2Data, error: p2Error }] = await Promise.all([
          supabase.from('players').select('elo_rating').eq('id', player1_id).single(),
          supabase.from('players').select('elo_rating').eq('id', player2_id).single()
        ]);
        
        if (p1Error || p2Error) {
          return res.status(500).json({ error: 'Failed to fetch player data for ELO calculation' });
        }
        
        const player1Elo = player1Data?.elo_rating ?? 1000;
        const player2Elo = player2Data?.elo_rating ?? 1000;
        
        // Calculate expected scores
        const expectedScorePlayer1 = 1 / (1 + Math.pow(10, (player2Elo - player1Elo) / 400));
        const expectedScorePlayer2 = 1 / (1 + Math.pow(10, (player1Elo - player2Elo) / 400));
        
        // Actual scores (1 for win, 0 for loss)
        const actualScorePlayer1 = winner_id === player1_id ? 1 : 0;
        const actualScorePlayer2 = winner_id === player2_id ? 1 : 0;
        
        // K-factor (32 is standard)
        const K = 32;
        
        // Calculate ELO changes
        finalPlayer1EloChange = Math.round(K * (actualScorePlayer1 - expectedScorePlayer1));
        finalPlayer2EloChange = Math.round(K * (actualScorePlayer2 - expectedScorePlayer2));
      }

      // Insert the match
      const { data, error } = await supabase
        .from('matches')
        .insert([{
          player1_id,
          player2_id,
          player1_score,
          player2_score,
          winner_id,
          player1_elo_change: finalPlayer1EloChange,
          player2_elo_change: finalPlayer2EloChange,
          played_at: playedAtValue
        }])
        .select('*');

      if (error) {
        console.error('Supabase error in POST /api/matches:', error)
        return res.status(500).json({ error: error.message });
      }
      
      // Fetch player data once for both stats update and Slack notification
      const [{ data: player1, error: p1Err }, { data: player2, error: p2Err }] = await Promise.all([
        supabase.from('players').select('elo_rating, matches_played, matches_won, matches_lost, name').eq('id', player1_id).single(),
        supabase.from('players').select('elo_rating, matches_played, matches_won, matches_lost, name').eq('id', player2_id).single()
      ])
      
      if (p1Err || p2Err) {
        console.error('Error fetching player data:', { p1Err, p2Err })
      } else {
        // Update player stats
        const player1Won = winner_id === player1_id ? 1 : 0
        const player2Won = winner_id === player2_id ? 1 : 0

        const [{ error: up1Err }, { error: up2Err }] = await Promise.all([
          supabase.from('players').update({
            elo_rating: (player1?.elo_rating ?? 0) + finalPlayer1EloChange,
            matches_played: (player1?.matches_played ?? 0) + 1,
            matches_won: (player1?.matches_won ?? 0) + player1Won,
            matches_lost: (player1?.matches_lost ?? 0) + (1 - player1Won),
          }).eq('id', player1_id),
          supabase.from('players').update({
            elo_rating: (player2?.elo_rating ?? 0) + finalPlayer2EloChange,
            matches_played: (player2?.matches_played ?? 0) + 1,
            matches_won: (player2?.matches_won ?? 0) + player2Won,
            matches_lost: (player2?.matches_lost ?? 0) + (1 - player2Won),
          }).eq('id', player2_id),
        ])

        if (up1Err || up2Err) {
          console.error('Error updating player stats:', { up1Err, up2Err })
        }
      }
      
      // Send Slack notification
      try {
        const slackData = {
          player1_id,
          player2_id,
          player1_score,
          player2_score,
          winner_id,
          player1_name: player1?.name || 'Unknown Player',
          player2_name: player2?.name || 'Unknown Player'
        };

        const slackResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ping-pong-slack-notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(slackData)
        });

        if (!slackResponse.ok) {
          console.error('Slack notification failed:', await slackResponse.text());
        }
      } catch (slackError) {
        console.error('Error sending Slack notification:', slackError);
        // Don't fail the match creation if Slack fails
      }
      
      return res.status(200).json(data[0]);
    } catch (err) {
      console.error('Unexpected error in POST /api/matches:', err)
      return res.status(500).json({ error: 'Unexpected error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
