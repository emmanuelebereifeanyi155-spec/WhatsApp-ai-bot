const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
const VERIFY_TOKEN = "digitalcctv123";
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else { res.sendStatus(403); }
});
app.post('/webhook', async (req, res) => {
  const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (msg) {
    const from = msg.from;
    const text = msg.text?.body || "Hello";
    try {
      const ai = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
        model: "llama3-70b-8192",
        messages: [
          {role: "system", content: "You are Meta AI, a helpful friendly assistant. You can answer any question - math, life, code, gist, anything. Be conversational."},
          {role: "user", content: text}
        ]
      }, {headers: {Authorization: `Bearer ${process.env.GROQ_API_KEY}`}});
      const reply = ai.data.choices[0].message.content;
      await axios.post(`https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`, {
        messaging_product: "whatsapp", to: from, text: {body: reply}
      }, {headers: {Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`}});
    } catch(e){ console.log(e.message); }
  }
  res.sendStatus(200);
});
app.listen(process.env.PORT || 3000);
