import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    if (!process.env.FISH_API_KEY) {
      return res.status(200).json({ audioUrl: null });
    }

    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FISH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        reference_id: process.env.FISH_MODEL_ID || 'f0227f70151e4366965c8ac77c28e9ad',
        format: 'mp3',
        mp3_bitrate: 128,
      }),
    });

    if (!response.ok) throw new Error(`Fish API error: ${response.status}`);

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return res.status(200).json({ audioUrl: `data:audio/mpeg;base64,${base64}` });

  } catch (error) {
    console.error('Speak API error:', error);
    return res.status(200).json({ audioUrl: null });
  }
}
