import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FISH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        reference_id: process.env.FISH_MODEL_ID || 'f0227f70151e4366965c8ac77c28e9ad',
        format: 'mp3',
        mp3_bitrate: 128,
      }),
    });

    if (!response.ok) {
      throw new Error(`Fish API error: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();

    const blob = await put(
      `rick-game-${Date.now()}.mp3`,
      new Blob([buffer], { type: 'audio/mpeg' }),
      {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN
      }
    );

    res.status(200).json({ audioUrl: blob.url });

  } catch (error) {
    console.error('Speak API error:', error);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
}
