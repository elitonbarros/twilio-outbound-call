require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

const { jwt: { AccessToken }, twiml: { VoiceResponse } } = require('twilio');
const VoiceGrant = AccessToken.VoiceGrant;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// --- /token: returns a JWT for the Voice JS SDK ---
app.get('/token', (req, res) => {
  try {
    const {
      TWILIO_ACCOUNT_SID,
      TWILIO_API_KEY,
      TWILIO_API_SECRET,
      TWIML_APP_SID
    } = process.env;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY || !TWILIO_API_SECRET || !TWIML_APP_SID) {
      return res.status(500).send('Missing Twilio env vars');
    }

    // Give the browser a stable identity (can be anything unique per user)
    const identity = 'web-client';

    const token = new AccessToken(
      TWILIO_ACCOUNT_SID,
      TWILIO_API_KEY,
      TWILIO_API_SECRET,
      { identity }
    );

    // Allow this client to place calls via your TwiML App
    const grant = new VoiceGrant({
      outgoingApplicationSid: TWIML_APP_SID,
      incomingAllow: true
    });
    token.addGrant(grant);

    const jwt = token.toJwt();
    res.type('text/plain').send(jwt);
  } catch (e) {
    console.error('Token error:', e);
    res.status(500).send('Token generation failed');
  }
});

// --- /voice: TwiML executed by your TwiML App Voice URL ---
app.post('/voice', (req, res) => {
  const twiml = new VoiceResponse();

  const to = (req.body.To || '').trim(); // comes from device.connect({ params: { To } })
  const callerId = process.env.TWILIO_CALLER_ID; // your purchased/verified Twilio number

  if (!to) {
    twiml.say('Missing destination number.');
  } else if (!callerId) {
    twiml.say('Caller ID is not configured.');
  } else {
    const dial = twiml.dial({ callerId });
    // This actually places the PSTN call:
    dial.number(to);
  }

  res.type('text/xml').send(twiml.toString());
});

// Health check
app.get('/health', (_, res) => res.send('ok'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
