require('dotenv').config();
const express = require('express');
const { jwt: { ClientCapability }, twiml: { VoiceResponse } } = require('twilio');

const app = express();
const port = 3000;

app.use(express.static('public')); // serves your frontend
app.use(express.urlencoded({ extended: false })); // needed to parse form body
app.use(express.json()); // needed to parse JSON

app.get('/token', (req, res) => {
  const capability = new ClientCapability({
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
  });

  capability.addScope(
    new ClientCapability.OutgoingClientScope({
      applicationSid: process.env.TWIML_APP_SID,
    })
  );

  const token = capability.toJwt();
  res.send(token);
});

// ✅ This is Step 7 – Webhook to respond with TwiML
app.post('/voice', (req, res) => {
  const response = new VoiceResponse();
  const dial = response.dial();
  dial.number(req.body.To);
  res.type('text/xml');
  res.send(response.toString());
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
