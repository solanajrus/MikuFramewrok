// api/chat.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ content: [{ type: 'text', text: 'Wrong method' }] });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ content: [{ type: 'text', text: 'ERROR: No API key found in environment' }] });
  }

  try {
    const { messages } = req.body;
    const userMessage = messages?.[messages.length - 1]?.content || "hello";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ 
              text: `You are Miku, a warm and gentle companion. Respond to this message in 1-2 short sentences. Be soft and caring. No emojis. The user said: "${userMessage}"` 
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 100
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
          ]
        })
      }
    );

    const data = await response.json();
    
    // Return raw response for debugging
    const geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (geminiText) {
      return res.status(200).json({ content: [{ type: 'text', text: geminiText }] });
    } else {
      // Show what we got back
      return res.status(200).json({ 
        content: [{ type: 'text', text: 'RAW RESPONSE: ' + JSON.stringify(data).substring(0, 300) }] 
      });
    }

  } catch (err) {
    return res.status(200).json({ content: [{ type: 'text', text: 'CATCH ERROR: ' + err.message }] });
  }
}
