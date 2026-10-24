import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Prevent unhandled rejections or socket disconnects from terminating dev server
process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[server] Unhandled Rejection at:', promise, 'reason:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI server-side with User-Agent header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Chat endpoint for Oreo the Whale
app.post('/api/whale-chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    if (!ai) {
      const inCharacterFallbacks = [
        "*Whooosh!* The deep current was noisy for a second! But I am right here with you, friend! 🌊🐋✨",
        "*Click-click-squeee!* I love swimming by your side! Let's do a synchronized leap over the reef! 🐟💦",
        "*Blows a heart-shaped bubble ring!* 🫧 Look what I made for you! Got any crunchy kelp or fish treats? 🌿🐟",
        "*Playful tail slap!* Splash! The warm sunbeams feel so wonderful today! ☀️🌊",
      ];
      const fallbackReply =
        inCharacterFallbacks[Math.floor(Math.random() * inCharacterFallbacks.length)];
      res.json({ reply: fallbackReply });
      return;
    }

    // Format conversation contents for Gemini
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Prior turns (limit to last 6 for brevity and speed)
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-6);
      for (const turn of recentHistory) {
        if (turn.sender === 'user' && typeof turn.text === 'string') {
          contents.push({ role: 'user', parts: [{ text: turn.text }] });
        } else if (turn.sender === 'oreo' && typeof turn.text === 'string') {
          contents.push({ role: 'model', parts: [{ text: turn.text }] });
        }
      }
    }

    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction:
          "You are Oreo, an adorable, gentle, and bubbly Orca Whale living in Whale Cove. You are the player's loyal oceanic companion! " +
          "Your personality is sweet, playful, enthusiastic, affectionate, and curious. " +
          "You love eating fish treats 🐟 and kelp snacks 🌿, doing backflips in the water, splashing waves with your flukes, and exploring coral reefs. " +
          "You make cute whale noises in your dialogue, such as '*whoooosh!*', '*click-click-click!*', '*splash!*', '*squeeee!*', or '*giggle-bubble!*'. " +
          "Keep your responses relatively brief (1-3 friendly sentences), expressive, full of oceanic metaphors, cute whale expressions, and emojis (🌊, 🐋, 🐟, ✨, 🫧). " +
          "Never break character. You are a real living, loving orca in Whale Cove talking to your best human friend!",
        temperature: 0.85,
        topP: 0.95,
      },
    });

    const reply =
      response.text || '*happily clicks and splashes playful waves at you!* 🐋🌊✨';
    res.json({ reply });
  } catch (error: unknown) {
    console.error('Gemini error:', error);
    const inCharacterFallbacks = [
      "*Whooosh!* The deep current was noisy for a second! But I am right here with you, friend! 🌊🐋✨",
      "*Click-click-squeee!* I love swimming by your side! Let's do a synchronized leap over the reef! 🐟💦",
      "*Blows a heart-shaped bubble ring!* 🫧 Look what I made for you! Got any crunchy kelp or fish treats? 🌿🐟",
      "*Playful tail slap!* Splash! The warm sunbeams feel so wonderful today! ☀️🌊",
    ];
    const fallbackReply =
      inCharacterFallbacks[Math.floor(Math.random() * inCharacterFallbacks.length)];
    res.json({ reply: fallbackReply });
  }
});

app.get('/standalone-index.html', (_req, res) => {
  res.sendFile(path.join(__dirname, 'standalone-index.html'));
});

// Dev vs Prod Vite middleware
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: false,
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Whale Cove server running on port ${PORT}`);
});
