import { supabase } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get all monthly awards
    try {
      const { data, error } = await supabase
        .from('monthly_awards')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (error) throw error
      res.status(200).json(data)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  } else if (req.method === 'POST') {
    // Save monthly awards (batch insert)
    try {
      const awards = req.body.awards
      
      if (!awards || !Array.isArray(awards)) {
        return res.status(400).json({ error: 'Awards array is required' })
      }

      // Use upsert to handle duplicates (update if exists)
      const { data, error } = await supabase
        .from('monthly_awards')
        .upsert(awards, { 
          onConflict: 'player_id,category,month,year',
          ignoreDuplicates: false 
        })
        .select()

      if (error) throw error
      res.status(200).json(data)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}

