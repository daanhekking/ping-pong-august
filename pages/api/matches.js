import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false }); // Always newest first

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const {
      player1_id,
      player2_id,
      player1_score,
      player2_score,
      winner_id,
      player1_elo_change,
      player2_elo_change
    } = req.body;

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
      .select('*') // Return inserted match
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
